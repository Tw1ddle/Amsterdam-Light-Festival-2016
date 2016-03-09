package;

import composer.RenderPass;
import composer.ShaderPass;
import dat.GUI;
import dat.ShaderGUI;
import dat.ThreeObjectGUI;
import js.Browser;
import js.html.CanvasElement;
import js.html.CanvasRenderingContext2D;
import js.html.Element;
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
import three.OrthographicCamera;
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
import shaders.Mixer;

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
	var VIDEO_FEED = "Video Feed";
	var PROCESSED_VIDEO_FEED = "Processed Video Feed";
	var EFFECT_PASSTHROUGH_MIXTURE = "Effect And Passthrough Mix";
	var FEED_EFFECT_MIXTURE = "Feed And Effect Mix";
	var FULL_EFFECT = "Full Effect";
	var DISTANCE_FIELD = "Distance Field";
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
	private var camera:OrthographicCamera; // Camera for viewing the final scene
	private var screen:Mesh; // The screen on which the final scene is rendered
	
	private var copyMaterial:ShaderMaterial; // Display material for the regular video feed
	
	private var sdfMaker:SDFMaker; // The signed distance field creator, takes the video feed
	private var sdfDisplayMaterial:ShaderMaterial; // The display material for the signed distance fields
	
	// For generating distance fields from the video feed
	private var videoPing:WebGLRenderTarget;
	private var videoPong:WebGLRenderTarget;
	
	// The render targets for the denoise filter
	private var denoiseTargetPing:WebGLRenderTarget;
	private var denoiseTargetPong:WebGLRenderTarget;

	// Distance field textures
	private var pattern0:Texture;
	private var pattern1:Texture;
	private var pattern2:Texture;
	private var pattern3:Texture;
	private var pattern4:Texture;
	
	// The scene div
	private var gameDiv:Element;
	
	// Luminance histogram
	private var lumHistogram:Histogram;
	
	private var sceneComposer:EffectComposer; // The composer for post-processing the final scene
	private var aaPass:ShaderPass; // Anti-aliasing pass
	
	private var denoisePass:ShaderPass; // Denoise pass
	
	private var mixerPass:ShaderPass; // Texture mixing pass
	
	private var blurIterations:Int; // The number of iterations of the Gaussian blur pass applied to the feed
	
	private var feedLuminance(default, set):Float; // Approx average luminance of the last frame of the feed (0-1)
	
	// WebRTC video elements
	private var videoWidth(default, set):Int;
	private var videoHeight(default, set):Int;
	private var videoPotWidth:Int;
	private var videoPotHeight:Int;
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
	
	private inline function initialize():Void {
		// Create scene div
		gameDiv = Browser.document.createElement("attach");
		
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
		
		// Initial renderer settings
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
		
		// videoPot* set implicitly
		videoWidth = 1920;
		videoHeight = 1080;
		
		makeRenderTargets(videoPotWidth, videoPotHeight);
	}
	
	private inline function setupEvents():Void {
		// Window resize
		Browser.window.addEventListener("resize", function():Void {
			onResize();
		}, true);
		
		// Disable context menu opening
		Browser.window.addEventListener("contextmenu", function(event) {
			event.preventDefault();
		}, true);
		
		// Toggles the video playback on click
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
	}
	
	private inline function start():Void {
		#if debug
		// Setup performance stats
		setupStats();
		
		// Onscreen debug controls
		setupGUI();
		#end
		
		// Initial renderer setup
		onResize();
		
		// Present game and start animation loop
		gameDiv.appendChild(renderer.domElement);
		Browser.window.requestAnimationFrame(animate);
	}
	
	private inline function changeResolution():Void {
		// Change camera resolution
		// TODO reinitialize render targets
	}
	
	private inline function makeRenderTargets(width:Int, height:Int):Void {
		var makeTarget = function(target:WebGLRenderTarget):WebGLRenderTarget {
			if (target != null && target.width == width && target.height == height) {
				return target;
			} else if (target != null) {
				target.dispose();
				return new WebGLRenderTarget(width, height);
			} else {
				return new WebGLRenderTarget(width, height);
			}
		}
		videoPing = makeTarget(videoPing);
		videoPong = makeTarget(videoPong);
		denoiseTargetPing = makeTarget(denoiseTargetPing);
		denoiseTargetPong = makeTarget(denoiseTargetPong);
	}
	
	private inline function onWindowLoaded():Void {
		initialize();
		
		var width = Browser.window.innerWidth * renderer.getPixelRatio();
		var height = Browser.window.innerHeight * renderer.getPixelRatio();
		
		displayMode = DisplayMode.FULL_EFFECT; // Default to full effect
		
		scene = new Scene();
		camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1.0, 1000.0);
		
		camera.position.z = 70;
		scene.add(camera);
		
		// Setup video feed
		videoElement = Browser.document.createVideoElement();
		videoElement.width = videoWidth;
		videoElement.height = videoHeight;
		videoElement.autoplay = true;
		videoElement.loop = true;
		
		// Make webRTC video request
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
		potVideoCanvas.width = videoPotWidth;
		potVideoCanvas.height = videoPotHeight;
		potVideoCtx = potVideoCanvas.getContext("2d");
		potVideoTexture = new Texture(potVideoCanvas); // TODO use mipmaps to estimate luminance?
		potVideoTexture.needsUpdate = true;
		
		feedLuminance = 1.0; // Start with feed luminance maxed out
		
		// Initialize the luminance histogram
		lumHistogram = new Histogram(255);
		
		copyMaterial = new ShaderMaterial( {
			vertexShader: Copy.vertexShader,
			fragmentShader: Copy.fragmentShader,
			uniforms: Copy.uniforms
		});
		
		// Make the SDF maker
		sdfMaker = new SDFMaker(renderer);
		
		sdfDisplayMaterial = new ShaderMaterial({
			vertexShader: EDT_DISPLAY_DEMO.vertexShader,
			fragmentShader: EDT_DISPLAY_DEMO.fragmentShader,
			uniforms: UniformsUtils.clone(EDT_DISPLAY_DEMO.uniforms)
		});
		sdfDisplayMaterial.transparent = true;
		sdfDisplayMaterial.derivatives = true;
		sdfDisplayMaterial.uniforms.tDiffuse.value = videoPing; // Set proper value in animate loop
		sdfDisplayMaterial.uniforms.texw.value = videoPotWidth;
		sdfDisplayMaterial.uniforms.texh.value = videoPotHeight;
		sdfDisplayMaterial.uniforms.texLevels.value = sdfMaker.texLevels;
		sdfDisplayMaterial.uniforms.pattern0.value = pattern0;
		sdfDisplayMaterial.uniforms.pattern1.value = pattern1;
		sdfDisplayMaterial.uniforms.pattern2.value = pattern2;
		sdfDisplayMaterial.uniforms.pattern3.value = pattern3;
		sdfDisplayMaterial.uniforms.pattern4.value = pattern4;
		
		var geometry = new PlaneGeometry(videoPotWidth, videoPotHeight, 1, 1);
		screen = new Mesh(geometry, sdfDisplayMaterial);
		scene.add(screen);
		
		camera.lookAt(screen.position);
		
		// Setup passes
		denoisePass = new ShaderPass( { vertexShader: BoxDenoise.vertexShader, fragmentShader: BoxDenoise.fragmentShader, uniforms: BoxDenoise.uniforms } );
		denoisePass.renderToScreen = false;
		denoisePass.uniforms.resolution.value.set(width, height);
		
		// Default Gaussian blur iterations
		blurIterations = 1;
		
		mixerPass = new ShaderPass( { vertexShader: Mixer.vertexShader, fragmentShader: Mixer.fragmentShader, uniforms: Mixer.uniforms } );
		
		sceneComposer = new EffectComposer(renderer);
		
		var renderPass = new RenderPass(scene, camera);
		
		aaPass = new ShaderPass( { vertexShader: FXAA.vertexShader, fragmentShader: FXAA.fragmentShader, uniforms: FXAA.uniforms } );
		aaPass.uniforms.resolution.value.set(width, height);
		aaPass.renderToScreen = true;
		
		sceneComposer.addPass(renderPass);
		sceneComposer.addPass(aaPass);
		
		setupEvents();
		
		start();
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
	
	private inline function nextPowerOfTwo(x:Int):Int {
		var power:Int = 1;
		
		while(power < x) {
			power *= 2;
		}
		
		return power;
	}
	
	// Called when browser window resizes
	private function onResize():Void {
		var width = Browser.window.innerWidth * renderer.getPixelRatio();
		var height = Browser.window.innerHeight * renderer.getPixelRatio();
		
		renderer.setSize(Browser.window.innerWidth, Browser.window.innerHeight);
		
		sceneComposer.setSize(width, height);
		aaPass.uniforms.resolution.value.set(width, height);
		denoisePass.uniforms.resolution.value.set(width, height);
		
		camera.updateProjectionMatrix();
	}
	
	private function animate(time:Float):Void {
		#if debug
		stats.begin();
		#end
		
		dt = (time - lastAnimationTime) * 0.001; // Seconds
		lastAnimationTime = time;
		
		if (videoElement.readyState == 4) { // 4 = HAVE_ENOUGH_DATA
			potVideoCtx.drawImage(videoElement, (videoPotWidth - videoWidth) / 2, (videoPotHeight - videoHeight) / 2, videoWidth, videoHeight);
			potVideoTexture.image = potVideoCanvas;
			potVideoTexture.needsUpdate = true;
			
			switch(displayMode) {
				case VIDEO_FEED:
					// Straight texture copy
					screen.material = copyMaterial;
					copyMaterial.uniforms.tDiffuse.value = potVideoTexture;
					
					sceneComposer.render(dt);
				case PROCESSED_VIDEO_FEED:
					// Denoise, blur and copy
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
					
				case FEED_EFFECT_MIXTURE:
					// Denoise, blur, render full, render denoised, render mixed
					denoisePass.uniforms.direction.value = 0.0;
					denoisePass.uniforms.tDiffuse.value = potVideoTexture;
					denoisePass.render(renderer, denoiseTargetPing, potVideoTexture, dt);
					denoisePass.uniforms.direction.value = 1.0;
					denoisePass.uniforms.tDiffuse.value = denoiseTargetPing;
					denoisePass.render(renderer, denoiseTargetPong, potVideoTexture, dt);
					
					screen.material = sdfDisplayMaterial;
					var sdf = sdfMaker.transformRenderTarget(denoiseTargetPong, videoPing, videoPong, blurIterations);
					sdfDisplayMaterial.uniforms.tDiffuse.value = sdf;
					
					aaPass.renderToScreen = false;
					sceneComposer.render(dt);
					aaPass.renderToScreen = true;
					
					screen.material = copyMaterial;
					var blur = sdfMaker.blur(denoiseTargetPong.texture, videoPing.width, videoPing.height, videoPing, videoPong, blurIterations);
					copyMaterial.uniforms.tDiffuse.value = blur;
					
					aaPass.renderToScreen = false;
					renderer.render(scene, camera, denoiseTargetPong, true);
					aaPass.renderToScreen = true;
					
					mixerPass.uniforms.tLeft.value = sceneComposer.renderTarget2;
					mixerPass.uniforms.tRight.value = denoiseTargetPong;
					
					mixerPass.renderToScreen = true;
					mixerPass.render(renderer, null, null, dt);
					mixerPass.renderToScreen = false;
					
				case EFFECT_PASSTHROUGH_MIXTURE:
					// Denoise, blur, render full, render passthrough, render mixed
					denoisePass.uniforms.direction.value = 0.0;
					denoisePass.uniforms.tDiffuse.value = potVideoTexture;
					denoisePass.render(renderer, denoiseTargetPing, potVideoTexture, dt);
					denoisePass.uniforms.direction.value = 1.0;
					denoisePass.uniforms.tDiffuse.value = denoiseTargetPing;
					denoisePass.render(renderer, denoiseTargetPong, potVideoTexture, dt);
					
					screen.material = sdfDisplayMaterial;
					var sdf = sdfMaker.transformRenderTarget(denoiseTargetPong, videoPing, videoPong, blurIterations);
					sdfDisplayMaterial.uniforms.tDiffuse.value = sdf;
					
					aaPass.renderToScreen = false;
					sceneComposer.render(dt);
					aaPass.renderToScreen = true;
					
					screen.material = copyMaterial;
					aaPass.renderToScreen = false;
					renderer.render(scene, camera, denoiseTargetPong, true);
					aaPass.renderToScreen = true;
					
					mixerPass.uniforms.tLeft.value = sceneComposer.renderTarget2;
					mixerPass.uniforms.tRight.value = denoiseTargetPong;
					
					mixerPass.renderToScreen = true;
					mixerPass.render(renderer, null, null, dt);
					mixerPass.renderToScreen = false;
					
				case DISTANCE_FIELD:
					// Denoise, blur, render distance field
					denoisePass.uniforms.direction.value = 0.0;
					denoisePass.uniforms.tDiffuse.value = potVideoTexture;
					denoisePass.render(renderer, denoiseTargetPing, potVideoTexture, dt);
					denoisePass.uniforms.direction.value = 1.0;
					denoisePass.uniforms.tDiffuse.value = denoiseTargetPing;
					denoisePass.render(renderer, denoiseTargetPong, potVideoTexture, dt);
					
					screen.material = copyMaterial;
					var sdf = sdfMaker.transformRenderTarget(denoiseTargetPong, videoPing, videoPong, blurIterations);
					copyMaterial.uniforms.tDiffuse.value = sdf;
					
					aaPass.renderToScreen = true;
					sceneComposer.render(dt);
					
				case FULL_EFFECT:
					// Denoise, blur, render full
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
					feedLuminance = calculateAverageFrameLuminance(potVideoCanvas, potVideoCtx, (videoPotWidth - videoWidth) / 2, (videoPotHeight - videoHeight) / 2);
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
		
		var data = context.getImageData(originX, originY, videoWidth, videoHeight);
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
		
		shaderGUI.add(this, 'displayMode', {
			Full_Effect: FULL_EFFECT, 
			Processed_Video_Feed: PROCESSED_VIDEO_FEED,
			Feed_And_Effect_Mix : FEED_EFFECT_MIXTURE, 
			Effect_And_Passthrough_Mix: EFFECT_PASSTHROUGH_MIXTURE,
			Distance_Field : DISTANCE_FIELD,
			Video_Feed : VIDEO_FEED } ).listen();
		
		ShaderGUI.generate(shaderGUI, "EDT_DISPLAY", sdfDisplayMaterial.uniforms);
		ShaderGUI.generate(shaderGUI, "EDT_SEED", EDT_SEED.uniforms);
		ShaderGUI.generate(shaderGUI, "FXAA", aaPass.uniforms);
		ShaderGUI.generate(shaderGUI, "BOX_DENOISER", denoisePass.uniforms);
		ShaderGUI.generate(shaderGUI, "TEXTURE_MIXER", mixerPass.uniforms);
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
	
	private function set_videoWidth(width:Int):Int {
		this.videoWidth = width;
		videoPotWidth = nextPowerOfTwo(width);
		return this.videoWidth;
	}
	
	private function set_videoHeight(height:Int):Int {
		this.videoHeight = height;
		videoPotHeight = nextPowerOfTwo(height);
		return this.videoHeight;
	}
}