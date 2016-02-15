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
import sdf.shaders.EDT.EDT_SEED;
import shaders.EDT_DISPLAY_DEMO;
import shaders.FXAA;
import stats.Stats;
import three.Color;
import three.Mesh;
import three.PerspectiveCamera;
import three.PixelFormat;
import three.PlaneGeometry;
import three.postprocessing.EffectComposer;
import three.Scene;
import three.ShaderMaterial;
import three.Texture;
import three.TextureDataType;
import three.TextureFilter;
import three.UniformsUtils;
import three.WebGLRenderer;
import three.WebGLRenderTarget;
import three.Wrapping;
import webgl.Detector;
import shaders.FreiChen;
import three.ImageLoader;
import three.ImageUtils;

class Main {
	public static inline var REPO_URL:String = "https://github.com/Tw1ddle/Amsterdam_Light_Festival";
	public static inline var WEBSITE_URL:String = "http://samcodes.co.uk/";
	public static inline var TWITTER_URL:String = "https://twitter.com/Sam_Twidale";
	public static inline var HAXE_URL:String = "http://haxe.org/";
	
	private var renderer:WebGLRenderer; // The renderer
	private var scene:Scene; // The final scene
	private var camera:PerspectiveCamera; // The camera for viewing the final scene
	
	private var webcamComposer:EffectComposer; // The composer for post-processing the webcam feed
	private var edgePass:FreiChen; // Edge detection pass
	//private var blurPass: // Blurring pass
	private var sdfMaker:SDFMaker; // The signed distance field creator, takes the webcam feed
	private var sdfDisplayMaterial:ShaderMaterial; // The display material for the signed distance fields
	private var sdf:WebGLRenderTarget; //
	
	private var pattern0:Texture;
	private var pattern1:Texture;
	private var pattern2:Texture;
	private var pattern3:Texture;
	private var pattern4:Texture;
	
	private var sceneComposer:EffectComposer; // The composer for post-processing the final scene
	private var aaPass:ShaderPass; // Anti-aliasing pass
	
	// WebRTC webcam elements
	private var videoElement:VideoElement;
	private var potVideoCanvas:CanvasElement;
	private var potVideoCtx:CanvasRenderingContext2D;
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
		info.innerHTML = '<a href="https://github.com/Tw1ddle/Amsterdam-Light-Show-2016" target="_blank">Biomimetics</a> by <a href="http://www.samcodes.co.uk/" target="_blank">Sam Twidale</a> & <a href="http://harishpersad.tumblr.com/" target="_blank">Harish Persad</a>.';
		container.appendChild(info);
		
		var width = Browser.window.innerWidth * renderer.getPixelRatio();
		var height = Browser.window.innerHeight * renderer.getPixelRatio();
		
		scene = new Scene();
		camera = new PerspectiveCamera(75, width / height, 1.0, 8000.0);
		camera.position.z = 150;
		scene.add(camera);
		
		// Setup webcam video feed
		videoElement = Browser.document.createVideoElement();
		videoElement.width = 320;
		videoElement.height = 240;
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
		
		// Make the POT canvas element and context that the video will be drawn to
		potVideoCanvas = Browser.document.createCanvasElement();
		potVideoCanvas.width = 512;
		potVideoCanvas.height = 512;
		potVideoCtx = potVideoCanvas.getContext("2d");
		
		// Some patterned textures that are masked by the distance field
		pattern0 = ImageUtils.loadTexture("assets/pattern0.png");
		pattern1 = ImageUtils.loadTexture("assets/pattern1.png");
		pattern2 = ImageUtils.loadTexture("assets/pattern2.png");
		pattern3 = ImageUtils.loadTexture("assets/pattern3.png");
		pattern4 = ImageUtils.loadTexture("assets/pattern4.png");
		
		// Make the SDF maker
		sdfMaker = new SDFMaker(renderer);
		
		sdf = sdfMaker.transformTexture(new Texture(potVideoCanvas), false);
		
		sdfDisplayMaterial = new ShaderMaterial({
			vertexShader: EDT_DISPLAY_DEMO.vertexShader,
			fragmentShader: EDT_DISPLAY_DEMO.fragmentShader,
			uniforms: UniformsUtils.clone(EDT_DISPLAY_DEMO.uniforms)
		});
		sdfDisplayMaterial.transparent = true;
		sdfDisplayMaterial.derivatives = true;
		sdfDisplayMaterial.uniforms.tDiffuse.value = sdf;
		sdfDisplayMaterial.uniforms.texw.value = potVideoCanvas.width;
		sdfDisplayMaterial.uniforms.texh.value = potVideoCanvas.height;
		sdfDisplayMaterial.uniforms.texLevels.value = sdfMaker.texLevels;
		sdfDisplayMaterial.uniforms.pattern0.value = pattern0;
		sdfDisplayMaterial.uniforms.pattern1.value = pattern1;
		sdfDisplayMaterial.uniforms.pattern2.value = pattern2;
		sdfDisplayMaterial.uniforms.pattern3.value = pattern3;
		sdfDisplayMaterial.uniforms.pattern4.value = pattern4;
		
		var geometry = new PlaneGeometry(100, 100, 1, 1);
		var screen = new Mesh(geometry, sdfDisplayMaterial);
		scene.add(screen);
		
		camera.lookAt(screen.position);
		
		// Setup composer passes
		sceneComposer = new EffectComposer(renderer);
		
		var renderPass = new RenderPass(scene, camera);
		
		aaPass = new ShaderPass( { vertexShader: FXAA.vertexShader, fragmentShader: FXAA.fragmentShader, uniforms: FXAA.uniforms } );
		aaPass.renderToScreen = true;
		aaPass.uniforms.resolution.value.set(width, height);
		
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
		
		// Add characters on keypress
		Browser.window.addEventListener("keypress", function(event) {
			event.preventDefault();
		}, true);
		
		// Remove characters on delete/backspace
		Browser.window.addEventListener("keydown", function(event) {
			event.preventDefault();
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
	
	private function webcamLoadSuccess(stream:Dynamic):Void {
		trace("Succeeded getting webcam");
		videoElement.src = windowUrl.createObjectURL(stream);
	}
	
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
			potVideoCtx.drawImage(videoElement, 0, 0, 320, 240);
			var texture = new Texture(potVideoCanvas);
			
			// TODO perform edge detection on the webcam texture
			var renderTargetParams = {
				minFilter: TextureFilter.NearestFilter,
				magFilter: TextureFilter.NearestFilter,
				wrapS: Wrapping.ClampToEdgeWrapping,
				wrapT: Wrapping.ClampToEdgeWrapping,
				format: cast PixelFormat.RGBAFormat,
				stencilBuffer: false,
				depthBuffer: false,
				type: TextureDataType.UnsignedByteType
			};
			var target = new WebGLRenderTarget(texture.image.width, texture.image.height, renderTargetParams);
			
			texture.needsUpdate = true;
			sdf = sdfMaker.transformTexture(texture, false);
			sdfDisplayMaterial.uniforms.tDiffuse.value = sdf;
		}
		
		sceneComposer.render(dt);
		
		Browser.window.requestAnimationFrame(animate);
		
		#if debug
		stats.end();
		#end
	}
	
	#if debug
	private inline function setupGUI():Void {
		ThreeObjectGUI.addItem(sceneGUI, camera, "World Camera");
		ThreeObjectGUI.addItem(sceneGUI, scene, "Scene");
		
		ShaderGUI.generate(shaderGUI, "EDT_DISPLAY", sdfDisplayMaterial.uniforms);
		ShaderGUI.generate(shaderGUI, "EDT_SEED", EDT_SEED.uniforms);
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