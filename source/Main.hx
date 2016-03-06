package;

import composer.RenderPass;
import composer.ShaderPass;
import dat.GUI;
import dat.ShaderGUI;
import dat.ThreeObjectGUI;
import js.Browser;
import js.html.CanvasElement;
import js.html.CanvasRenderingContext2D;
import js.html.VideoElement;
import sdf.generator.SDFMaker;
import sdf.shaders.Copy;
import sdf.shaders.EDT.EDT_SEED;
import sdf.shaders.GaussianBlur;
import shaders.BoxDenoise;
import shaders.EDT_DISPLAY_DEMO;
import shaders.FXAA;
import stats.Stats;
import three.Color;
import three.ImageUtils;
import three.Mesh;
import three.PerspectiveCamera;
import three.PlaneGeometry;
import three.Scene;
import three.ShaderMaterial;
import three.Texture;
import three.UniformsUtils;
import three.WebGLRenderTarget;
import three.WebGLRenderer;
import three.Wrapping;
import three.postprocessing.EffectComposer;
import webgl.Detector;

class Histogram {
	public inline function new(size:Int) {
		this.size = size;
		bins = new Array<{ count:Int, cumulative:Float }>();
		for (i in 0...size) {
			bins.push( { count: 0, cumulative: 0.0 } );
		}
	}
	
	public function add(intensity:Float):Void {
		var bin = binForIntensity(intensity);
		bins[bin].count += 1;
		bins[bin].cumulative += intensity;
		total++;
	}
	
	public function reset():Void {
		bins = new Array<{ count:Int, cumulative:Float }>();
		for (i in 0...size) {
			bins.push( { count: 0, cumulative: 0.0 } );
		}
		total = 0;
	}
	
	public inline function intensityForBin(bin:Int):Float {
		return Math.min(Math.max(0.0, 1.0 / bin), 1.0);
	}
	
	public inline function binForIntensity(intensity:Float):Int {
		return Std.int(Math.min(1.0, intensity) * (size - 1));
	}
	
	public var bins:Array<{ count:Int, cumulative:Float }>;
	public var total:Int;
	public var size:Int;
}

@:enum abstract DisplayMode(String) from String to String {
	var WEBCAM_FEED = "Webcam Feed";
	var PROCESSED_WEBCAM_FEED = "Processed Webcam Feed";
	var FULL_EFFECT = "Full Effect";
}

class Main {
	public static inline var PROJECT_NAME:String = "Biomimetics";
	public static inline var REPO_URL:String = "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016";
	public static inline var SAM_WEBSITE_URL:String = "http://samcodes.co.uk/";
	public static inline var HARISH_WEBSITE_URL:String = "http://harishpersad.tumblr.com/";
	public static inline var TWITTER_URL:String = "https://twitter.com/Sam_Twidale";
	public static inline var HAXE_URL:String = "http://haxe.org/";
	
	private var renderer:WebGLRenderer; // The renderer
	private var displayMode:DisplayMode; // The mode for displaying the feed
	private var scene:Scene; // The final scene
	private var camera:PerspectiveCamera; // Camera for viewing the final scene
	private var screen:Mesh; // The screen on which the final scene is rendered
	
	private var copyMaterial:ShaderMaterial; // Display material for the regular webcam feed
	
	private var sdfMaker:SDFMaker; // The signed distance field creator, takes the webcam feed
	private var sdfDisplayMaterial:ShaderMaterial; // The display material for the signed distance fields
	
	// For generating distance fields from the webcam feed
	private var videoPing:WebGLRenderTarget;
	private var videoPong:WebGLRenderTarget;

	// Distance field textures
	private var pattern0:Texture;
	private var pattern1:Texture;
	private var pattern2:Texture;
	private var pattern3:Texture;
	private var pattern4:Texture;
	
	// Luminance histogram
	private var lumHistogram:Histogram;
	
	private var sceneComposer:EffectComposer; // The composer for post-processing the final scene
	private var aaPass:ShaderPass; // Anti-aliasing pass
	
	private var denoisePass:ShaderPass; // Denoise pass
	
	// The render targets for the denoise filter
	private var denoiseTargetPing:WebGLRenderTarget;
	private var denoiseTargetPong:WebGLRenderTarget;
	
	private var blurIterations:Int; // The number of iterations of the Gaussian blur pass applied to the feed
	
	private var feedLuminance(default, set):Float; // Approx average luminance of the last frame of the feed (0-1)
	
	// WebRTC webcam elements
	private var webcamWidth:Int;
	private var webcamHeight:Int;
	private var webcamPotWidth:Int;
	private var webcamPotHeight:Int;
	private var videoElement:VideoElement;
	private var potVideoCanvas:CanvasElement;
	private var potVideoCtx:CanvasRenderingContext2D;
	private var potVideoTexture:Texture;
	private var windowUrl:Dynamic;
	
	private static var lastAnimationTime:Float = 0.0; // Last time from requestAnimationFrame
	private static var dt:Float = 0.0; // Frame delta time
	
	#if debug
	private var sceneGUI:GUI = new GUI( { autoPlace:true } );
	private var shaderGUI:GUI = new GUI( { autoPlace:true } );
	private var stats(default, null):Stats;
	#end
	
    private static function main():Void {
		var main = new Main();
	}
	
	private inline function new() {
		Browser.window.onload = onWindowLoaded;
	}
	
	private inline function onWindowLoaded():Void {
		var gameDiv = Browser.document.createElement("attach");
		
		// WebGL support check
		var glSupported:WebGLSupport = Detector.detect();
		if (glSupported != SUPPORTED_AND_ENABLED) {
			var unsupportedInfo = Browser.document.createElement('div');
			unsupportedInfo.style.position = 'absolute';
			unsupportedInfo.style.top = '10px';
			unsupportedInfo.style.width = '100%';
			unsupportedInfo.style.textAlign = 'center';
			unsupportedInfo.style.color = '#ffffff';
			
			switch(glSupported) {
				case WebGLSupport.NOT_SUPPORTED:
					unsupportedInfo.innerHTML = 'Your browser does not support WebGL. Click <a href="' + REPO_URL + '" target="_blank">here for project info</a> instead.';
				case WebGLSupport.SUPPORTED_BUT_DISABLED:
					unsupportedInfo.innerHTML = 'Your browser supports WebGL, but the feature appears to be disabled. Click <a href="' + REPO_URL + '" target="_blank">here for project info</a> instead.';
				default:
					unsupportedInfo.innerHTML = 'Could not detect WebGL support. Click <a href="' + REPO_URL + '" target="_blank">here for project info</a> instead.';
			}
			
			gameDiv.appendChild(unsupportedInfo);
			return;
		}
		
		// Setup WebGL renderer
        renderer = new WebGLRenderer( { antialias: true } );
		
		// WebGL extensions support check
		var extDerivatives = 'OES_standard_derivatives';
		var ext = renderer.context.getExtension(extDerivatives);
		if (ext == null) {
			var missingExtensionInfo = Browser.document.createElement('div');
			missingExtensionInfo.style.position = 'absolute';
			missingExtensionInfo.style.top = '10px';
			missingExtensionInfo.style.width = '100%';
			missingExtensionInfo.style.textAlign = 'center';
			missingExtensionInfo.style.color = '#ffffff';
			missingExtensionInfo.innerHTML = 'Missing required WebGL extension: ' + extDerivatives + ' Click <a href="' + REPO_URL + '" target="_blank">here for project info</a> instead.';
			gameDiv.appendChild(missingExtensionInfo);
			return;
		}
		
        renderer.sortObjects = false;
		renderer.autoClear = false;
		renderer.setClearColor(new Color(0x000000));
		renderer.setPixelRatio(Browser.window.devicePixelRatio);
		
		// Attach game div
		var gameAttachPoint = Browser.document.getElementById("game");
		gameAttachPoint.appendChild(gameDiv);
		
		// Add credits
		var container = Browser.document.createElement('div');
		Browser.document.body.appendChild(container);
		var info = Browser.document.createElement('div');
		info.style.position = 'absolute';
		info.style.top = '20px';
		info.style.width = '100%';
		info.style.textAlign = 'center';
		info.style.color = 'white';
		info.innerHTML = '<a href="' + REPO_URL + 'target="_blank">' + PROJECT_NAME + '</a> by <a href="' + SAM_WEBSITE_URL + '" target="_blank">Sam Twidale</a> & <a href="' + HARISH_WEBSITE_URL + '" target="_blank">Harish Persad</a>.';
		container.appendChild(info);
		
		var width = Browser.window.innerWidth * renderer.getPixelRatio();
		var height = Browser.window.innerHeight * renderer.getPixelRatio();
		
		displayMode = DisplayMode.FULL_EFFECT; // Default to full effect
		
		scene = new Scene();
		camera = new PerspectiveCamera(75, width / height, 1.0, 1000.0);
		camera.position.z = 70;
		scene.add(camera);
		
		// Setup webcam video feed
		webcamWidth = 960;
		webcamHeight = 540;
		webcamPotWidth = 1024;
		webcamPotHeight = 1024;
		videoElement = Browser.document.createVideoElement();
		videoElement.width = webcamWidth;
		videoElement.height = webcamHeight;
		videoElement.autoplay = true;
		videoElement.loop = true;
		
		// Make webRTC webcam request
		var nav:Dynamic = untyped navigator;
		Sure.sure(nav != null);
		windowUrl = untyped(window.URL || window.webkitURL);
		Sure.sure(windowUrl != null);
		nav.getUserMedia = untyped(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
		Sure.sure(nav.getUserMedia != null);
		nav.getUserMedia({ video: true }, webcamLoadSuccess, webcamLoadError);
		
		/*
		// Load a video instead of a webcam feed
		videoElement.src = "assets/touhou.mp4";
		videoElement.load();
		videoElement.play();
		*/
		
		// Make the POT canvas element and context that the video will be drawn to
		potVideoCanvas = Browser.document.createCanvasElement();
		potVideoCanvas.width = webcamPotWidth;
		potVideoCanvas.height = webcamPotHeight;
		potVideoCtx = potVideoCanvas.getContext("2d");
		potVideoTexture = new Texture(potVideoCanvas); // TODO use mipmaps to estimate luminance?
		potVideoTexture.needsUpdate = true;
		
		feedLuminance = 1.0; // Start with feed luminance maxed out
		
		// Helper method to create a pattern texture
		var makeTexture = function(path:String):Texture {
			var t = ImageUtils.loadTexture(path);
			t.wrapS = Wrapping.RepeatWrapping;
			t.wrapT = Wrapping.RepeatWrapping;
			t.repeat.set(2, 2);
			return t;
		};
		
		// Some patterned textures that are masked by the distance field
		pattern0 = makeTexture("assets/pattern0.png");
		pattern1 = makeTexture("assets/pattern1.png");
		pattern2 = makeTexture("assets/pattern2.png");
		pattern3 = makeTexture("assets/pattern3.png");
		pattern4 = makeTexture("assets/pattern4.png");
		
		// Initialize the luminance histogram
		lumHistogram = new Histogram(255);
		
		copyMaterial = new ShaderMaterial( {
			vertexShader: Copy.vertexShader,
			fragmentShader: Copy.fragmentShader,
			uniforms: Copy.uniforms
		});
		
		// Make the SDF maker
		sdfMaker = new SDFMaker(renderer);
		videoPing = new WebGLRenderTarget(webcamPotWidth, webcamPotHeight);
		videoPong = new WebGLRenderTarget(webcamPotWidth, webcamPotHeight);
		
		sdfDisplayMaterial = new ShaderMaterial({
			vertexShader: EDT_DISPLAY_DEMO.vertexShader,
			fragmentShader: EDT_DISPLAY_DEMO.fragmentShader,
			uniforms: UniformsUtils.clone(EDT_DISPLAY_DEMO.uniforms)
		});
		sdfDisplayMaterial.transparent = true;
		sdfDisplayMaterial.derivatives = true;
		sdfDisplayMaterial.uniforms.tDiffuse.value = videoPing; // Set proper value in animate loop
		sdfDisplayMaterial.uniforms.texw.value = webcamPotWidth;
		sdfDisplayMaterial.uniforms.texh.value = webcamPotHeight;
		sdfDisplayMaterial.uniforms.texLevels.value = sdfMaker.texLevels;
		sdfDisplayMaterial.uniforms.pattern0.value = pattern0;
		sdfDisplayMaterial.uniforms.pattern1.value = pattern1;
		sdfDisplayMaterial.uniforms.pattern2.value = pattern2;
		sdfDisplayMaterial.uniforms.pattern3.value = pattern3;
		sdfDisplayMaterial.uniforms.pattern4.value = pattern4;
		
		var geometry = new PlaneGeometry(100, 100, 1, 1);
		screen = new Mesh(geometry, sdfDisplayMaterial);
		scene.add(screen);
		
		camera.lookAt(screen.position);
		
		// Setup passes		
		denoiseTargetPing = new WebGLRenderTarget(webcamPotWidth, webcamPotHeight);
		denoiseTargetPong = new WebGLRenderTarget(webcamPotWidth, webcamPotHeight);
		denoisePass = new ShaderPass( { vertexShader: BoxDenoise.vertexShader, fragmentShader: BoxDenoise.fragmentShader, uniforms: BoxDenoise.uniforms } );
		denoisePass.renderToScreen = false;
		denoisePass.uniforms.resolution.value.set(width, height);
		
		// Default Gaussian blur iterations
		blurIterations = 1;
		
		sceneComposer = new EffectComposer(renderer);
		
		var renderPass = new RenderPass(scene, camera);
		
		aaPass = new ShaderPass( { vertexShader: FXAA.vertexShader, fragmentShader: FXAA.fragmentShader, uniforms: FXAA.uniforms } );
		aaPass.uniforms.resolution.value.set(width, height);
		aaPass.renderToScreen = true;
		
		sceneComposer.addPass(renderPass);
		sceneComposer.addPass(aaPass);
		
		// Initial renderer setup
		onResize();
		
		// Event setup
		// Window resize event
		Browser.window.addEventListener("resize", function():Void {
			onResize();
		}, true);
		
		// Disable context menu opening
		Browser.window.addEventListener("contextmenu", function(event) {
			event.preventDefault();
		}, true);
		
		// Toggles the video on click
		gameDiv.addEventListener("click", function(event) {
			if (videoElement.paused) {
				videoElement.play();
			} else {
				videoElement.pause();
			}
		}, true);
		
		var onMouseWheel = function(event) {
			event.preventDefault();
		}
		
		// Zoom in or out manually
		Browser.document.addEventListener("mousewheel", onMouseWheel, false);
		Browser.document.addEventListener("DOMMouseScroll", onMouseWheel, false);
		
		#if debug
		// Setup performance stats
		setupStats();
		
		// Onscreen debug controls
		setupGUI();
		#end
		
		// Present game and start animation loop
		gameDiv.appendChild(renderer.domElement);
		Browser.window.requestAnimationFrame(animate);
	}
	
	// Successfully got webcam feed
	private function webcamLoadSuccess(stream:Dynamic):Void {
		trace("Succeeded getting webcam");
		videoElement.src = windowUrl.createObjectURL(stream);
	}
	
	// Failed to open webcam feed
	private function webcamLoadError(error:Dynamic):Void {
		trace("Failed to get webcam");
	}
	
	// Called when browser window resizes
	private function onResize():Void {
		var width = Browser.window.innerWidth * renderer.getPixelRatio();
		var height = Browser.window.innerHeight * renderer.getPixelRatio();
		
		renderer.setSize(Browser.window.innerWidth, Browser.window.innerHeight);
		
		sceneComposer.setSize(width, height);
		aaPass.uniforms.resolution.value.set(width, height);
		denoisePass.uniforms.resolution.value.set(width, height);
		
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}
	
	private function animate(time:Float):Void {
		#if debug
		stats.begin();
		#end
		
		dt = (time - lastAnimationTime) * 0.001; // Seconds
		lastAnimationTime = time;
		
		if (videoElement.readyState == 4) { // 4 = HAVE_ENOUGH_DATA
			potVideoCtx.drawImage(videoElement, (webcamPotWidth - webcamWidth) / 2, (webcamPotHeight - webcamHeight) / 2, webcamWidth, webcamHeight);
			potVideoTexture.image = potVideoCanvas;
			potVideoTexture.needsUpdate = true;
			
			switch(displayMode) {
				case WEBCAM_FEED:					
					screen.material = copyMaterial;
					copyMaterial.uniforms.tDiffuse.value = potVideoTexture;
					
					sceneComposer.render(dt);
				case PROCESSED_WEBCAM_FEED:
					denoisePass.uniforms.direction.value = 0.0;
					denoisePass.uniforms.tDiffuse.value = potVideoTexture;
					denoisePass.render(renderer, denoiseTargetPing, potVideoTexture, dt);
					denoisePass.uniforms.direction.value = 1.0;
					denoisePass.uniforms.tDiffuse.value = denoiseTargetPing;
					denoisePass.render(renderer, denoiseTargetPong, potVideoTexture, dt);
					
					screen.material = copyMaterial;
					var blur = sdfMaker.blur(denoiseTargetPong.texture, videoPing.width, videoPing.height, videoPing, videoPong, blurIterations);
					copyMaterial.uniforms.tDiffuse.value = blur;
					
					sceneComposer.render(dt);
					
				case FULL_EFFECT:					
					denoisePass.uniforms.direction.value = 0.0;
					denoisePass.uniforms.tDiffuse.value = potVideoTexture;
					denoisePass.render(renderer, denoiseTargetPing, potVideoTexture, dt);
					denoisePass.uniforms.direction.value = 1.0;
					denoisePass.uniforms.tDiffuse.value = denoiseTargetPing;
					denoisePass.render(renderer, denoiseTargetPong, potVideoTexture, dt);
					
					screen.material = sdfDisplayMaterial;
					var sdf = sdfMaker.transformRenderTarget(denoiseTargetPong, videoPing, videoPong, blurIterations);
					sdfDisplayMaterial.uniforms.tDiffuse.value = sdf;
					
					sceneComposer.render(dt);
					
					// TODO use a weighted average over the last 10 or so frames?
					feedLuminance = calculateAverageFrameLuminance(potVideoCanvas, potVideoCtx, (webcamPotWidth - webcamWidth) / 2, (webcamPotHeight - webcamHeight) / 2);
			}
		}
		
		Browser.window.requestAnimationFrame(animate);
		
		#if debug
		stats.end();
		#end
	}
	
	// Slow approximate method for calculating frame luminance
	private inline function calculateAverageFrameLuminance(canvas:CanvasElement, context:CanvasRenderingContext2D, originX:Float, originY:Float, step:Int = 100 * 3):Float {
		if (canvas.width <= 0 || canvas.height <= 0) {
			return 0.0;
		}
		
		var data = context.getImageData(originX, originY, webcamWidth, webcamHeight);
		var total:Float = 0;
		var count:Float = 0;
		var i:Int = 0;
		while (i < data.data.length) {
			var intensity = (data.data[i] * 0.2126 + data.data[i + 1] * 0.7152 + data.data[i + 2] * 0.0722);
			total += intensity;
			count++;
			i += step;
			
			lumHistogram.add(intensity / 255.0);
		}
		
		//for (bin in lumHistogram.bins) {
		//	trace("Bin count " + bin.count);
		//	trace("Bin total " + bin.cumulative);
		//	trace("Bin average " + bin.cumulative / bin.count);
		//}
		
		lumHistogram.reset();
		
		return total / (count * 255.0);
	}
	
	private function set_feedLuminance(luminance:Float):Float {
		return this.feedLuminance = luminance;
	}
	
	#if debug
	private inline function setupGUI():Void {
		ThreeObjectGUI.addItem(sceneGUI, camera, "World Camera");
		ThreeObjectGUI.addItem(sceneGUI, scene, "Scene");
		
		shaderGUI.add(this, 'displayMode', { Full_Effect: FULL_EFFECT, Processed_Webcam_Feed: PROCESSED_WEBCAM_FEED, Webcam_Feed : WEBCAM_FEED } ).listen();
		
		ShaderGUI.generate(shaderGUI, "EDT_DISPLAY", sdfDisplayMaterial.uniforms);
		ShaderGUI.generate(shaderGUI, "EDT_SEED", EDT_SEED.uniforms);
		ShaderGUI.generate(shaderGUI, "FXAA", aaPass.uniforms);
		ShaderGUI.generate(shaderGUI, "BOX_DENOISER", denoisePass.uniforms);
		var f = ShaderGUI.generate(shaderGUI, "GAUSSIAN_BLUR", GaussianBlur.uniforms);
		f.add(this, 'blurIterations').listen().min(1).max(60);
		
		// TODO add GitHub icon
		shaderGUI.add( { f: function() { js.Browser.window.open(REPO_URL, "_blank"); } }, 'f').name("View Source");
	}
	
	private inline function setupStats(mode:Mode = Mode.MEM):Void {
		Sure.sure(stats == null);
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';
		Browser.window.document.body.appendChild(stats.domElement);
	}
	#end
}