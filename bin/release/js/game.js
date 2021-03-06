(function (console, $global) { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
var Histogram = function(size) {
	this.size = size;
	this.bins = [];
	var _g = 0;
	while(_g < size) {
		var i = _g++;
		this.bins.push({ count : 0, cumulative : 0.0});
	}
};
Histogram.__name__ = true;
Histogram.prototype = {
	add: function(intensity) {
		var bin = Std["int"](Math.min(1.0,intensity) * (this.size - 1));
		this.bins[bin].count += 1;
		this.bins[bin].cumulative += intensity;
		this.total++;
	}
	,reset: function() {
		this.bins = [];
		var _g1 = 0;
		var _g = this.size;
		while(_g1 < _g) {
			var i = _g1++;
			this.bins.push({ count : 0, cumulative : 0.0});
		}
		this.total = 0;
	}
	,intensityForBin: function(bin) {
		return Math.min(Math.max(0.0,1.0 / bin),1.0);
	}
	,binForIntensity: function(intensity) {
		return Std["int"](Math.min(1.0,intensity) * (this.size - 1));
	}
	,__class__: Histogram
};
var Main = function() {
	window.onload = $bind(this,this.onWindowLoaded);
};
Main.__name__ = true;
Main.main = function() {
	var main = new Main();
};
Main.prototype = {
	initialize: function() {
		this.gameDiv = window.document.createElement("attach");
		var glSupported = WebGLDetector.detect();
		if(glSupported != 0) {
			var unsupportedInfo = window.document.createElement("div");
			unsupportedInfo.style.position = "absolute";
			unsupportedInfo.style.top = "10px";
			unsupportedInfo.style.width = "100%";
			unsupportedInfo.style.textAlign = "center";
			unsupportedInfo.style.color = "#ffffff";
			switch(glSupported) {
			case 2:
				unsupportedInfo.innerHTML = "Your browser does not support WebGL. Click <a href=\"" + "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016" + "\" target=\"_blank\">here for project info</a> instead.";
				break;
			case 1:
				unsupportedInfo.innerHTML = "Your browser supports WebGL, but the feature appears to be disabled. Click <a href=\"" + "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016" + "\" target=\"_blank\">here for project info</a> instead.";
				break;
			default:
				unsupportedInfo.innerHTML = "Could not detect WebGL support. Click <a href=\"" + "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016" + "\" target=\"_blank\">here for project info</a> instead.";
			}
			this.gameDiv.appendChild(unsupportedInfo);
			return;
		}
		this.renderer = new THREE.WebGLRenderer({ antialias : true});
		var extDerivatives = "OES_standard_derivatives";
		var ext = this.renderer.context.getExtension(extDerivatives);
		if(ext == null) {
			var missingExtensionInfo = window.document.createElement("div");
			missingExtensionInfo.style.position = "absolute";
			missingExtensionInfo.style.top = "10px";
			missingExtensionInfo.style.width = "100%";
			missingExtensionInfo.style.textAlign = "center";
			missingExtensionInfo.style.color = "#ffffff";
			missingExtensionInfo.innerHTML = "Missing required WebGL extension: " + extDerivatives + " Click <a href=\"" + "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016" + "\" target=\"_blank\">here for project info</a> instead.";
			this.gameDiv.appendChild(missingExtensionInfo);
			return;
		}
		this.renderer.sortObjects = false;
		this.renderer.autoClear = false;
		this.renderer.setClearColor(new THREE.Color(0));
		this.renderer.setPixelRatio(window.devicePixelRatio);
		var gameAttachPoint = window.document.getElementById("game");
		gameAttachPoint.appendChild(this.gameDiv);
		var container = window.document.createElement("div");
		window.document.body.appendChild(container);
		var info = window.document.createElement("div");
		info.style.position = "absolute";
		info.style.top = "20px";
		info.style.width = "100%";
		info.style.textAlign = "center";
		info.style.color = "white";
		info.innerHTML = "<a href=\"" + "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016" + "target=\"_blank\">" + "Biomimetics" + "</a> by <a href=\"" + "http://samcodes.co.uk/" + "\" target=\"_blank\">Sam Twidale</a> & <a href=\"" + "http://harishpersad.tumblr.com/" + "\" target=\"_blank\">Harish Persad</a>.";
		container.appendChild(info);
		var makeTexture = function(path) {
			var t = THREE.ImageUtils.loadTexture(path);
			t.wrapS = THREE.RepeatWrapping;
			t.wrapT = THREE.RepeatWrapping;
			t.repeat.set(2,2);
			return t;
		};
		this.pattern0 = makeTexture("assets/pattern0.png");
		this.pattern1 = makeTexture("assets/pattern1.png");
		this.pattern2 = makeTexture("assets/pattern2.png");
		this.pattern3 = makeTexture("assets/pattern3.png");
		this.pattern4 = makeTexture("assets/pattern4.png");
		this.set_videoWidth(1920);
		this.set_videoHeight(1080);
		this.makeRenderTargets(this.videoPotWidth,this.videoPotHeight);
	}
	,setupEvents: function() {
		var _g = this;
		window.addEventListener("resize",function() {
			_g.onResize();
		},true);
		window.addEventListener("contextmenu",function(event1) {
			event1.preventDefault();
		},true);
		this.gameDiv.addEventListener("click",function(event2) {
			if(_g.videoElement.paused) _g.videoElement.play(); else _g.videoElement.pause();
		},true);
		var onMouseWheel = function(event) {
			event.preventDefault();
		};
		window.document.addEventListener("mousewheel",onMouseWheel,false);
		window.document.addEventListener("DOMMouseScroll",onMouseWheel,false);
	}
	,start: function() {
		this.onResize();
		this.gameDiv.appendChild(this.renderer.domElement);
		window.requestAnimationFrame($bind(this,this.animate));
	}
	,changeResolution: function() {
	}
	,makeRenderTargets: function(width,height) {
		var makeTarget = function(target) {
			if(target != null && target.width == width && target.height == height) return target; else if(target != null) {
				target.dispose();
				return new THREE.WebGLRenderTarget(width,height);
			} else return new THREE.WebGLRenderTarget(width,height);
		};
		this.videoPing = makeTarget(this.videoPing);
		this.videoPong = makeTarget(this.videoPong);
		this.denoiseTargetPing = makeTarget(this.denoiseTargetPing);
		this.denoiseTargetPong = makeTarget(this.denoiseTargetPong);
	}
	,onWindowLoaded: function() {
		this.initialize();
		var width = window.innerWidth * this.renderer.getPixelRatio();
		var height = window.innerHeight * this.renderer.getPixelRatio();
		this.displayMode = "Full Effect";
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera(width / -2,width / 2,height / 2,height / -2,1.0,1000.0);
		this.camera.position.z = 70;
		this.scene.add(this.camera);
		var _this = window.document;
		this.videoElement = _this.createElement("video");
		this.videoElement.width = this.videoWidth;
		this.videoElement.height = this.videoHeight;
		this.videoElement.autoplay = true;
		this.videoElement.loop = true;
		var nav = navigator;
		if(!(nav != null)) throw new js__$Boot_HaxeError("FAIL: nav != null");
		this.windowUrl = window.URL || window.webkitURL;
		if(!(this.windowUrl != null)) throw new js__$Boot_HaxeError("FAIL: windowUrl != null");
		nav.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		if(!(nav.getUserMedia != null)) throw new js__$Boot_HaxeError("FAIL: nav.getUserMedia != null");
		nav.getUserMedia({ video : true},$bind(this,this.webcamLoadSuccess),$bind(this,this.webcamLoadError));
		var _this1 = window.document;
		this.potVideoCanvas = _this1.createElement("canvas");
		this.potVideoCanvas.width = this.videoPotWidth;
		this.potVideoCanvas.height = this.videoPotHeight;
		this.potVideoCtx = this.potVideoCanvas.getContext("2d");
		this.potVideoTexture = new THREE.Texture(this.potVideoCanvas);
		this.potVideoTexture.needsUpdate = true;
		this.set_feedLuminance(1.0);
		this.lumHistogram = new Histogram(255);
		this.copyMaterial = new THREE.ShaderMaterial({ vertexShader : sdf_shaders_Copy.vertexShader, fragmentShader : sdf_shaders_Copy.fragmentShader, uniforms : sdf_shaders_Copy.uniforms});
		this.sdfMaker = new sdf_generator_SDFMaker(this.renderer);
		this.sdfDisplayMaterial = new THREE.ShaderMaterial({ vertexShader : shaders_EDT_$DISPLAY_$DEMO.vertexShader, fragmentShader : shaders_EDT_$DISPLAY_$DEMO.fragmentShader, uniforms : THREE.UniformsUtils.clone(shaders_EDT_$DISPLAY_$DEMO.uniforms)});
		this.sdfDisplayMaterial.transparent = true;
		this.sdfDisplayMaterial.derivatives = true;
		this.sdfDisplayMaterial.uniforms.tDiffuse.value = this.videoPing;
		this.sdfDisplayMaterial.uniforms.texw.value = this.videoPotWidth;
		this.sdfDisplayMaterial.uniforms.texh.value = this.videoPotHeight;
		this.sdfDisplayMaterial.uniforms.texLevels.value = this.sdfMaker.texLevels;
		this.sdfDisplayMaterial.uniforms.pattern0.value = this.pattern0;
		this.sdfDisplayMaterial.uniforms.pattern1.value = this.pattern1;
		this.sdfDisplayMaterial.uniforms.pattern2.value = this.pattern2;
		this.sdfDisplayMaterial.uniforms.pattern3.value = this.pattern3;
		this.sdfDisplayMaterial.uniforms.pattern4.value = this.pattern4;
		var geometry = new THREE.PlaneGeometry(this.videoPotWidth,this.videoPotHeight,1,1);
		this.screen = new THREE.Mesh(geometry,this.sdfDisplayMaterial);
		this.scene.add(this.screen);
		this.camera.lookAt(this.screen.position);
		this.denoisePass = new THREE.ShaderPass({ vertexShader : shaders_BoxDenoise.vertexShader, fragmentShader : shaders_BoxDenoise.fragmentShader, uniforms : shaders_BoxDenoise.uniforms});
		this.denoisePass.renderToScreen = false;
		this.denoisePass.uniforms.resolution.value.set(width,height);
		this.blurIterations = 1;
		this.mixerPass = new THREE.ShaderPass({ vertexShader : shaders_Mixer.vertexShader, fragmentShader : shaders_Mixer.fragmentShader, uniforms : shaders_Mixer.uniforms});
		this.sceneComposer = new THREE.EffectComposer(this.renderer);
		var renderPass = new THREE.RenderPass(this.scene,this.camera);
		this.aaPass = new THREE.ShaderPass({ vertexShader : shaders_FXAA.vertexShader, fragmentShader : shaders_FXAA.fragmentShader, uniforms : shaders_FXAA.uniforms});
		this.aaPass.uniforms.resolution.value.set(width,height);
		this.aaPass.renderToScreen = true;
		this.sceneComposer.addPass(renderPass);
		this.sceneComposer.addPass(this.aaPass);
		this.setupEvents();
		this.onResize();
		this.gameDiv.appendChild(this.renderer.domElement);
		window.requestAnimationFrame($bind(this,this.animate));
	}
	,webcamLoadSuccess: function(stream) {
		this.videoElement.src = this.windowUrl.createObjectURL(stream);
	}
	,webcamLoadError: function(error) {
		null;
	}
	,nextPowerOfTwo: function(x) {
		var power = 1;
		while(power < x) power *= 2;
		return power;
	}
	,onResize: function() {
		var width = window.innerWidth * this.renderer.getPixelRatio();
		var height = window.innerHeight * this.renderer.getPixelRatio();
		this.renderer.setSize(window.innerWidth,window.innerHeight);
		this.sceneComposer.setSize(width,height);
		this.aaPass.uniforms.resolution.value.set(width,height);
		this.denoisePass.uniforms.resolution.value.set(width,height);
		this.camera.updateProjectionMatrix();
	}
	,animate: function(time) {
		Main.dt = (time - Main.lastAnimationTime) * 0.001;
		Main.lastAnimationTime = time;
		if(this.videoElement.readyState == 4) {
			this.potVideoCtx.drawImage(this.videoElement,(this.videoPotWidth - this.videoWidth) / 2,(this.videoPotHeight - this.videoHeight) / 2,this.videoWidth,this.videoHeight);
			this.potVideoTexture.image = this.potVideoCanvas;
			this.potVideoTexture.needsUpdate = true;
			var _g = this.displayMode;
			switch(_g) {
			case "Video Feed":
				this.screen.material = this.copyMaterial;
				this.copyMaterial.uniforms.tDiffuse.value = this.potVideoTexture;
				this.sceneComposer.render(Main.dt);
				break;
			case "Processed Video Feed":
				this.denoisePass.uniforms.direction.value = 0.0;
				this.denoisePass.uniforms.tDiffuse.value = this.potVideoTexture;
				this.denoisePass.render(this.renderer,this.denoiseTargetPing,this.potVideoTexture,Main.dt);
				this.denoisePass.uniforms.direction.value = 1.0;
				this.denoisePass.uniforms.tDiffuse.value = this.denoiseTargetPing;
				this.denoisePass.render(this.renderer,this.denoiseTargetPong,this.potVideoTexture,Main.dt);
				this.screen.material = this.copyMaterial;
				var blur = this.sdfMaker.blur(this.denoiseTargetPong.texture,this.videoPing.width,this.videoPing.height,this.videoPing,this.videoPong,this.blurIterations);
				this.copyMaterial.uniforms.tDiffuse.value = blur;
				this.sceneComposer.render(Main.dt);
				break;
			case "Feed And Effect Mix":
				this.denoisePass.uniforms.direction.value = 0.0;
				this.denoisePass.uniforms.tDiffuse.value = this.potVideoTexture;
				this.denoisePass.render(this.renderer,this.denoiseTargetPing,this.potVideoTexture,Main.dt);
				this.denoisePass.uniforms.direction.value = 1.0;
				this.denoisePass.uniforms.tDiffuse.value = this.denoiseTargetPing;
				this.denoisePass.render(this.renderer,this.denoiseTargetPong,this.potVideoTexture,Main.dt);
				this.screen.material = this.sdfDisplayMaterial;
				var sdf = this.sdfMaker.transformRenderTarget(this.denoiseTargetPong,this.videoPing,this.videoPong,this.blurIterations);
				this.sdfDisplayMaterial.uniforms.tDiffuse.value = sdf;
				this.aaPass.renderToScreen = false;
				this.sceneComposer.render(Main.dt);
				this.aaPass.renderToScreen = true;
				this.screen.material = this.copyMaterial;
				var blur1 = this.sdfMaker.blur(this.denoiseTargetPong.texture,this.videoPing.width,this.videoPing.height,this.videoPing,this.videoPong,this.blurIterations);
				this.copyMaterial.uniforms.tDiffuse.value = blur1;
				this.aaPass.renderToScreen = false;
				this.renderer.render(this.scene,this.camera,this.denoiseTargetPong,true);
				this.aaPass.renderToScreen = true;
				this.mixerPass.uniforms.tLeft.value = this.sceneComposer.renderTarget2;
				this.mixerPass.uniforms.tRight.value = this.denoiseTargetPong;
				this.mixerPass.renderToScreen = true;
				this.mixerPass.render(this.renderer,null,null,Main.dt);
				this.mixerPass.renderToScreen = false;
				break;
			case "Effect And Passthrough Mix":
				this.denoisePass.uniforms.direction.value = 0.0;
				this.denoisePass.uniforms.tDiffuse.value = this.potVideoTexture;
				this.denoisePass.render(this.renderer,this.denoiseTargetPing,this.potVideoTexture,Main.dt);
				this.denoisePass.uniforms.direction.value = 1.0;
				this.denoisePass.uniforms.tDiffuse.value = this.denoiseTargetPing;
				this.denoisePass.render(this.renderer,this.denoiseTargetPong,this.potVideoTexture,Main.dt);
				this.screen.material = this.sdfDisplayMaterial;
				var sdf1 = this.sdfMaker.transformRenderTarget(this.denoiseTargetPong,this.videoPing,this.videoPong,this.blurIterations);
				this.sdfDisplayMaterial.uniforms.tDiffuse.value = sdf1;
				this.aaPass.renderToScreen = false;
				this.sceneComposer.render(Main.dt);
				this.aaPass.renderToScreen = true;
				this.screen.material = this.copyMaterial;
				this.aaPass.renderToScreen = false;
				this.renderer.render(this.scene,this.camera,this.denoiseTargetPong,true);
				this.aaPass.renderToScreen = true;
				this.mixerPass.uniforms.tLeft.value = this.sceneComposer.renderTarget2;
				this.mixerPass.uniforms.tRight.value = this.denoiseTargetPong;
				this.mixerPass.renderToScreen = true;
				this.mixerPass.render(this.renderer,null,null,Main.dt);
				this.mixerPass.renderToScreen = false;
				break;
			case "Distance Field":
				this.denoisePass.uniforms.direction.value = 0.0;
				this.denoisePass.uniforms.tDiffuse.value = this.potVideoTexture;
				this.denoisePass.render(this.renderer,this.denoiseTargetPing,this.potVideoTexture,Main.dt);
				this.denoisePass.uniforms.direction.value = 1.0;
				this.denoisePass.uniforms.tDiffuse.value = this.denoiseTargetPing;
				this.denoisePass.render(this.renderer,this.denoiseTargetPong,this.potVideoTexture,Main.dt);
				this.screen.material = this.copyMaterial;
				var sdf2 = this.sdfMaker.transformRenderTarget(this.denoiseTargetPong,this.videoPing,this.videoPong,this.blurIterations);
				this.copyMaterial.uniforms.tDiffuse.value = sdf2;
				this.aaPass.renderToScreen = true;
				this.sceneComposer.render(Main.dt);
				break;
			case "Full Effect":
				this.denoisePass.uniforms.direction.value = 0.0;
				this.denoisePass.uniforms.tDiffuse.value = this.potVideoTexture;
				this.denoisePass.render(this.renderer,this.denoiseTargetPing,this.potVideoTexture,Main.dt);
				this.denoisePass.uniforms.direction.value = 1.0;
				this.denoisePass.uniforms.tDiffuse.value = this.denoiseTargetPing;
				this.denoisePass.render(this.renderer,this.denoiseTargetPong,this.potVideoTexture,Main.dt);
				this.screen.material = this.sdfDisplayMaterial;
				var sdf3 = this.sdfMaker.transformRenderTarget(this.denoiseTargetPong,this.videoPing,this.videoPong,this.blurIterations);
				this.sdfDisplayMaterial.uniforms.tDiffuse.value = sdf3;
				this.sceneComposer.render(Main.dt);
				this.set_feedLuminance(this.calculateAverageFrameLuminance(this.potVideoCanvas,this.potVideoCtx,(this.videoPotWidth - this.videoWidth) / 2,(this.videoPotHeight - this.videoHeight) / 2,null));
				break;
			}
		}
		window.requestAnimationFrame($bind(this,this.animate));
	}
	,calculateAverageFrameLuminance: function(canvas,context,originX,originY,step) {
		if(step == null) step = 300;
		if(canvas.width <= 0 || canvas.height <= 0) return 0.0;
		var data = context.getImageData(originX,originY,this.videoWidth,this.videoHeight);
		var total = 0;
		var count = 0;
		var i = 0;
		while(i < data.data.length) {
			var intensity = data.data[i] * 0.2126 + data.data[i + 1] * 0.7152 + data.data[i + 2] * 0.0722;
			total += intensity;
			count++;
			i += step;
			this.lumHistogram.add(intensity / 255.0);
		}
		this.lumHistogram.reset();
		return total / (count * 255.0);
	}
	,set_feedLuminance: function(luminance) {
		return this.feedLuminance = luminance;
	}
	,set_videoWidth: function(width) {
		this.videoWidth = width;
		this.videoPotWidth = this.nextPowerOfTwo(width);
		return this.videoWidth;
	}
	,set_videoHeight: function(height) {
		this.videoHeight = height;
		this.videoPotHeight = this.nextPowerOfTwo(height);
		return this.videoHeight;
	}
	,__class__: Main
	,__properties__: {set_videoHeight:"set_videoHeight",set_videoWidth:"set_videoWidth",set_feedLuminance:"set_feedLuminance"}
};
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
Reflect.getProperty = function(o,field) {
	var tmp;
	if(o == null) return null; else if(o.__properties__ && (tmp = o.__properties__["get_" + field])) return o[tmp](); else return o[field];
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
var dat_ShaderGUI = function() { };
dat_ShaderGUI.__name__ = true;
dat_ShaderGUI.generate = function(gui,folderName,uniforms,exclude) {
	var keys = Reflect.fields(uniforms);
	var folder = gui.addFolder(folderName);
	var _g = 0;
	while(_g < keys.length) {
		var key = keys[_g];
		++_g;
		var v = Reflect.getProperty(uniforms,key);
		if(exclude != null && HxOverrides.indexOf(exclude,key,0) != -1) continue;
		var type = v.type;
		var value = v.value;
		switch(type) {
		case "f":
			if(Object.prototype.hasOwnProperty.call(v,"min") && Object.prototype.hasOwnProperty.call(v,"max")) folder.add(v,"value").listen().min(v.min).max(v.max).name(key); else folder.add(v,"value").listen().name(key);
			break;
		case "v2":
			var f = folder.addFolder(key);
			f.add(v.value,"x").listen().name(key + "_x");
			f.add(v.value,"y").listen().name(key + "_y");
			break;
		case "v3":
			var f1 = folder.addFolder(key);
			f1.add(v.value,"x").listen().name(key + "_x");
			f1.add(v.value,"y").listen().name(key + "_y");
			f1.add(v.value,"z").listen().name(key + "_z");
			break;
		case "v4":
			var f2 = folder.addFolder(key);
			f2.add(v.value,"x").listen().name(key + "_x");
			f2.add(v.value,"y").listen().name(key + "_y");
			f2.add(v.value,"z").listen().name(key + "_z");
			f2.add(v.value,"w").listen().name(key + "_w");
			break;
		}
	}
	return folder;
};
var dat_ThreeObjectGUI = function() { };
dat_ThreeObjectGUI.__name__ = true;
dat_ThreeObjectGUI.addItem = function(gui,object,tag) {
	if(gui == null || object == null) return null;
	var folder = null;
	if(tag != null) folder = gui.addFolder(tag + " (" + dat_ThreeObjectGUI.guiItemCount++ + ")"); else {
		var name = Std.string(Reflect.field(object,"name"));
		if(name == null || name.length == 0) folder = gui.addFolder("Item (" + dat_ThreeObjectGUI.guiItemCount++ + ")"); else folder = gui.addFolder(Std.string(Reflect.getProperty(object,"name")) + " (" + dat_ThreeObjectGUI.guiItemCount++ + ")");
	}
	if(js_Boot.__instanceof(object,THREE.Scene)) {
		var scene = object;
		var _g = 0;
		var _g1 = scene.children;
		while(_g < _g1.length) {
			var object1 = _g1[_g];
			++_g;
			dat_ThreeObjectGUI.addItem(gui,object1);
		}
	}
	if(js_Boot.__instanceof(object,THREE.Object3D)) {
		var object3d = object;
		folder.add(object3d.position,"x",-5000.0,5000.0,2).listen();
		folder.add(object3d.position,"y",-5000.0,5000.0,2).listen();
		folder.add(object3d.position,"z",-20000.0,20000.0,2).listen();
		folder.add(object3d.rotation,"x",-Math.PI * 2,Math.PI * 2,0.01).listen();
		folder.add(object3d.rotation,"y",-Math.PI * 2,Math.PI * 2,0.01).listen();
		folder.add(object3d.rotation,"z",-Math.PI * 2,Math.PI * 2,0.01).listen();
		folder.add(object3d.scale,"x",0.0,10.0,0.01).listen();
		folder.add(object3d.scale,"y",0.0,10.0,0.01).listen();
		folder.add(object3d.scale,"z",0.0,10.0,0.01).listen();
	}
	if(js_Boot.__instanceof(object,THREE.PointLight)) {
		var light = object;
		folder.add(light,"intensity",0,3,0.01).listen();
	}
	return folder;
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
	__class__: js__$Boot_HaxeError
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js_Boot.__nativeClassName(o);
		if(name != null) return js_Boot.__resolveNativeClass(name);
		return null;
	}
};
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js_Boot.__interfLoop(js_Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return $global[name];
};
var sdf_generator_SDFMaker = function(renderer) {
	this.texLevels = 256.0;
	this.renderer = renderer;
	this.scene = new THREE.Scene();
	this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1)));
	this.camera = new THREE.OrthographicCamera(-0.5,0.5,0.5,-0.5,-1,1);
	this.camera.updateProjectionMatrix();
	this.blurMaterial = new THREE.ShaderMaterial({ vertexShader : sdf_shaders_GaussianBlur.vertexShader, fragmentShader : sdf_shaders_GaussianBlur.fragmentShader, uniforms : sdf_shaders_GaussianBlur.uniforms});
	this.seedMaterial = new THREE.ShaderMaterial({ vertexShader : sdf_shaders_EDT_$SEED.vertexShader, fragmentShader : sdf_shaders_EDT_$SEED.fragmentShader, uniforms : sdf_shaders_EDT_$SEED.uniforms, transparent : true});
	this.floodMaterial = new THREE.ShaderMaterial({ vertexShader : sdf_shaders_EDT_$FLOOD.vertexShader, fragmentShader : sdf_shaders_EDT_$FLOOD.fragmentShader, uniforms : sdf_shaders_EDT_$FLOOD.uniforms});
	this.renderTargetParams = { minFilter : THREE.NearestFilter, magFilter : THREE.NearestFilter, wrapS : THREE.ClampToEdgeWrapping, wrapT : THREE.ClampToEdgeWrapping, format : THREE.RGBAFormat, stencilBuffer : false, depthBuffer : false, type : THREE.UnsignedByteType};
};
sdf_generator_SDFMaker.__name__ = true;
sdf_generator_SDFMaker.prototype = {
	transformRenderTarget: function(target,ping,pong,blurIterations) {
		if(blurIterations == null) blurIterations = 1;
		return this.transform(target.texture,target.width,target.height,ping,pong,blurIterations);
	}
	,transformTexture: function(target,ping,pong,blurIterations) {
		if(blurIterations == null) blurIterations = 1;
		return this.transform(target,target.image.width,target.image.height,ping,pong,blurIterations);
	}
	,blur: function(texture,width,height,ping,pong,blurIterations) {
		this.scene.overrideMaterial = this.blurMaterial;
		this.blurMaterial.uniforms.resolution.value.set(width,height);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		ping.texture.minFilter = THREE.LinearFilter;
		ping.texture.magFilter = THREE.LinearFilter;
		ping.texture.wrapS = THREE.RepeatWrapping;
		ping.texture.wrapT = THREE.RepeatWrapping;
		pong.texture.minFilter = THREE.LinearFilter;
		pong.texture.magFilter = THREE.LinearFilter;
		pong.texture.wrapS = THREE.RepeatWrapping;
		pong.texture.wrapT = THREE.RepeatWrapping;
		var iterations = blurIterations;
		var tmp = null;
		this.blurMaterial.uniforms.flip.value = 1;
		var _g = 0;
		while(_g < iterations) {
			var i = _g++;
			var radius = iterations - i - 1;
			if(i == 0) {
				tmp = ping;
				this.blurMaterial.uniforms.tDiffuse.value = texture;
				this.blurMaterial.uniforms.direction.value.set(radius,0);
			} else if(i % 2 != 0) {
				tmp = pong;
				this.blurMaterial.uniforms.tDiffuse.value = ping;
				this.blurMaterial.uniforms.direction.value.set(0,radius);
			} else {
				tmp = ping;
				this.blurMaterial.uniforms.tDiffuse.value = pong;
				this.blurMaterial.uniforms.direction.value.set(radius,0);
			}
			this.renderer.render(this.scene,this.camera,tmp,true);
		}
		var source = ping;
		var target = pong;
		this.blurMaterial.uniforms.flip.value = 1;
		this.blurMaterial.uniforms.direction.value.set(0,0);
		this.blurMaterial.uniforms.tDiffuse.value = source;
		this.renderer.render(this.scene,this.camera,target,true);
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		ping.texture.wrapS = THREE.ClampToEdgeWrapping;
		ping.texture.wrapT = THREE.ClampToEdgeWrapping;
		ping.texture.minFilter = THREE.NearestFilter;
		ping.texture.magFilter = THREE.NearestFilter;
		pong.texture.wrapS = THREE.ClampToEdgeWrapping;
		pong.texture.wrapT = THREE.ClampToEdgeWrapping;
		pong.texture.minFilter = THREE.NearestFilter;
		pong.texture.magFilter = THREE.NearestFilter;
		return target;
	}
	,transform: function(texture,width,height,ping,pong,blurIterations) {
		if(ping == null) ping = new THREE.WebGLRenderTarget(width,height);
		if(pong == null) pong = new THREE.WebGLRenderTarget(width,height);
		var source = null;
		var target = null;
		if(blurIterations > 0) {
			source = this.blur(texture,width,height,ping,pong,blurIterations);
			if(source == ping) target = pong; else target = ping;
		} else {
			source = texture;
			target = ping;
		}
		this.scene.overrideMaterial = this.seedMaterial;
		this.seedMaterial.uniforms.tDiffuse.value = source;
		this.seedMaterial.uniforms.texLevels.value = this.texLevels;
		this.renderer.render(this.scene,this.camera,target,true);
		this.scene.overrideMaterial = this.floodMaterial;
		this.floodMaterial.uniforms.texLevels.value = this.texLevels;
		this.floodMaterial.uniforms.texw.value = width;
		this.floodMaterial.uniforms.texh.value = height;
		var stepSize;
		if(width > height) stepSize = width / 2 | 0; else stepSize = height / 2 | 0;
		var last = target;
		while(stepSize > 0) {
			this.floodMaterial.uniforms.tDiffuse.value = last;
			this.floodMaterial.uniforms.step.value = stepSize;
			if(last == ping) last = pong; else last = ping;
			this.renderer.render(this.scene,this.camera,last,true);
			stepSize = stepSize / 2 | 0;
		}
		this.scene.overrideMaterial = null;
		if(last != ping) ping.dispose();
		if(last != pong) pong.dispose();
		return last;
	}
	,__class__: sdf_generator_SDFMaker
};
var sdf_shaders_Copy = function() { };
sdf_shaders_Copy.__name__ = true;
var sdf_shaders_EDT_$SEED = function() { };
sdf_shaders_EDT_$SEED.__name__ = true;
var sdf_shaders_EDT_$FLOOD = function() { };
sdf_shaders_EDT_$FLOOD.__name__ = true;
var sdf_shaders_EDT_$DISPLAY_$AA = function() { };
sdf_shaders_EDT_$DISPLAY_$AA.__name__ = true;
var sdf_shaders_EDT_$DISPLAY_$OVERLAY = function() { };
sdf_shaders_EDT_$DISPLAY_$OVERLAY.__name__ = true;
var sdf_shaders_EDT_$DISPLAY_$RGB = function() { };
sdf_shaders_EDT_$DISPLAY_$RGB.__name__ = true;
var sdf_shaders_EDT_$DISPLAY_$GRAYSCALE = function() { };
sdf_shaders_EDT_$DISPLAY_$GRAYSCALE.__name__ = true;
var sdf_shaders_EDT_$DISPLAY_$ALPHA_$THRESHOLD = function() { };
sdf_shaders_EDT_$DISPLAY_$ALPHA_$THRESHOLD.__name__ = true;
var sdf_shaders_GaussianBlur = function() { };
sdf_shaders_GaussianBlur.__name__ = true;
var shaders_BoxDenoise = function() { };
shaders_BoxDenoise.__name__ = true;
var shaders_EDT_$DISPLAY_$DEMO = function() { };
shaders_EDT_$DISPLAY_$DEMO.__name__ = true;
var shaders_FXAA = function() { };
shaders_FXAA.__name__ = true;
var shaders_Mixer = function() { };
shaders_Mixer.__name__ = true;
var util_FileReader = function() { };
util_FileReader.__name__ = true;
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
String.prototype.__class__ = String;
String.__name__ = true;
Array.__name__ = true;
var Int = { __name__ : ["Int"]};
var Dynamic = { __name__ : ["Dynamic"]};
var Float = Number;
Float.__name__ = ["Float"];
var Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = { __name__ : ["Class"]};
var Enum = { };
Main.PROJECT_NAME = "Biomimetics";
Main.REPO_URL = "https://github.com/Tw1ddle/Amsterdam-Light-Festival-2016";
Main.SAM_WEBSITE_URL = "http://samcodes.co.uk/";
Main.HARISH_WEBSITE_URL = "http://harishpersad.tumblr.com/";
Main.TWITTER_URL = "https://twitter.com/Sam_Twidale";
Main.HAXE_URL = "http://haxe.org/";
Main.lastAnimationTime = 0.0;
Main.dt = 0.0;
dat_ThreeObjectGUI.guiItemCount = 0;
js_Boot.__toStr = {}.toString;
sdf_shaders_Copy.uniforms = { tDiffuse : { type : "t", value : null}};
sdf_shaders_Copy.vertexShader = "varying vec2 vUv;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_Copy.fragmentShader = "varying vec2 vUv;\r\n\r\nuniform sampler2D tDiffuse;\r\n\r\nvoid main()\r\n{\r\n\tgl_FragColor = texture2D(tDiffuse, vUv);\r\n}";
sdf_shaders_EDT_$SEED.uniforms = { tDiffuse : { type : "t", value : null}, texLevels : { type : "f", value : 0.0}, intensityOffset : { type : "f", value : 0.01}, luminanceWeights : { type : "v3", value : new THREE.Vector3(0.2125,0.7154,0.0721)}};
sdf_shaders_EDT_$SEED.vertexShader = "varying vec2 vUv;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$SEED.fragmentShader = "// Jump flooding algorithm for Euclidean distance transform, according to Danielsson (1980) and Guodong Rong (2007).\r\n// This shader initializes the distance field in preparation for the flood filling.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texLevels;\r\nuniform float intensityOffset;\r\nuniform vec3 luminanceWeights;\r\n\r\nvoid main()\r\n{\r\n\tfloat texel = clamp(dot(texture2D(tDiffuse, vUv).rgb, luminanceWeights) + intensityOffset, 0.0, 1.0);\r\n\t\r\n\t// Represents zero\r\n\tfloat myzero = 0.5 * texLevels / (texLevels - 1.0);\r\n\t\r\n\t// Represents infinity/not-yet-calculated\r\n\tfloat myinfinity = 0.0;\r\n\t\r\n\t// Sub-pixel AA distance\r\n\tfloat aadist = texel;\r\n\t\r\n\t// Pixels > 0.5 are objects, others are background\r\n\tgl_FragColor = vec4(vec2(texel > 0.9999999999 ? myinfinity : myzero), aadist, 1.0);\r\n}";
sdf_shaders_EDT_$FLOOD.uniforms = { tDiffuse : { type : "t", value : null}, texLevels : { type : "f", value : 0.0}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, step : { type : "f", value : 0.0}};
sdf_shaders_EDT_$FLOOD.vertexShader = "// Jump flooding algorithm for Euclidean distance transform, according to Danielsson (1980) and Guodong Rong (2007).\r\n// This code represents one iteration of the flood filling.\r\n// You need to run it multiple times with different step lengths to perform a full distance transformation.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float stepu;\r\nvarying float stepv;\r\n\r\nuniform float step;\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\t// Saves a division in the fragment shader\r\n\tstepu = step / texw;\r\n\tstepv = step / texh;\r\n\t\r\n\tvUv = uv;\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$FLOOD.fragmentShader = "// Jump flooding algorithm for Euclidean distance transform, according to Danielsson (1980) and Guodong Rong (2007).\r\n// This code represents one iteration of the flood filling.\r\n// You need to run it multiple times with different step lengths to perform a full distance transformation.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float stepu;\r\nvarying float stepv;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\n\r\n// Helper function to remap unsigned normalized floats [0.0..1.0]\r\n// coming from a texture stored in integer format internally to a\r\n// signed float vector pointing exactly to a pixel centre in texture\r\n// space. The range of valid vectors is\r\n// [-1.0+0.5/texsize, 1.0-0.5/texsize], with the special value\r\n// -1.0-0.5*texsize (represented as integer 0) meaning\r\n// \"distance vector still undetermined\".\r\n// The mapping is carefully designed to map both 8 bit and 16\r\n// bit integer texture data to distinct and exact floating point\r\n// texture coordinate offsets and vice versa.\r\n// 8 bit integer textures can be used to transform images up to\r\n// size 128x128 pixels, and 16 bit integer textures can be used to\r\n// transform images up to 32768x32768, i.e. beyond the largest\r\n// texture size available in current implementations of OpenGL.\r\n// Direct use of integers in the shader (by means of texture2DRect\r\n// and GL_RG8I and GL_RG16I texture formats) could be faster, but-1\r\n// this code is conveniently compatible even with version 1.2 of GLSL\r\n// (i.e. OpenGL 2.1), and the main shader is limited by texture access\r\n// and branching, not ALU capacity, so a few extra multiplications\r\n// for indexing and output storage are not that bad.\r\nvec2 remap(vec2 floatdata)\r\n{\r\n     return floatdata * (texLevels - 1.0) / texLevels * 2.0 - 1.0;\r\n}\r\n\r\nvec2 remap_inv(vec2 floatvec)\r\n{\r\n     return (floatvec + 1.0) * 0.5 * texLevels / (texLevels - 1.0);\r\n}\r\n\r\n// TODO this isn't ideal, also will it work for most texture sizes?\r\nvec3 sampleTexture(sampler2D texture, vec2 vec)\r\n{\r\n\t// The algorithm depends on the texture having a CLAMP_TO_BORDER attribute and a border color with R = 0.\r\n\t// These explicit conditionals to avoid propagating incorrect vectors when looking outside of [0,1] in UV cause a slowdown of about 25%.\r\n\tif(vec.x >= 1.0 || vec.y >= 1.0 || vec.x <= 0.0 || vec.y <= 0.0)\r\n\t{\r\n\t\tvec = clamp(vec, 0.0, 1.0);\r\n\t\treturn vec3(0.0, 0.0, 0.0);\r\n\t}\r\n\t\r\n\treturn texture2D(texture, vec).rgb;\r\n}\r\n\r\nvoid testCandidate(in vec2 stepvec, inout vec4 bestseed)\r\n{\r\n\tvec2 newvec = vUv + stepvec; // Absolute position of that candidate\r\n\tvec3 texel = sampleTexture(tDiffuse, newvec).rgb;\r\n\tvec4 newseed; // Closest point from that candidate (xy), its AA distance (z) and its grayscale value (w)\r\n\tnewseed.xy = remap(texel.rg);\r\n\tif(newseed.x > -0.9999999999) // If the new seed is not \"indeterminate distance\"\r\n\t{\r\n\t\tnewseed.xy = newseed.xy + stepvec;\r\n\t\t\r\n\t\t// TODO: implement better equations for calculating the AA distance\r\n\t\t// Try by getting the direction of the edge using the gradients of nearby edge pixels \r\n\t\t\r\n\t\tfloat di = length(newseed.xy);\r\n\t\tfloat df = texel.b - 0.5;\r\n\t\t\r\n\t\t// TODO: This AA assumes texw == texh. It does not allow for non-square textures.\r\n\t\tnewseed.z = di + (df / texw);\r\n\t\tnewseed.w = texel.b;\r\n\t\t\r\n\t\tif(newseed.z < bestseed.z)\r\n\t\t{\r\n\t\t\tbestseed = newseed;\r\n\t\t}\r\n\t}\r\n}\r\n\r\nvoid main()\r\n{\r\n\t// Searches for better distance vectors among 8 candidates\r\n\tvec3 texel = sampleTexture(tDiffuse, vUv).rgb;\r\n\t\r\n\t// Closest seed so far\r\n\tvec4 bestseed;\r\n\tbestseed.xy = remap(texel.rg);\r\n\tbestseed.z = length(bestseed.xy) + (texel.b - 0.5) / texw; // Add AA edge offset to distance\r\n\tbestseed.w = texel.b; // Save AA/grayscale value\r\n\t\r\n\ttestCandidate(vec2(-stepu, -stepv), bestseed);\r\n\ttestCandidate(vec2(-stepu, 0.0), bestseed);\r\n\ttestCandidate(vec2(-stepu, stepv), bestseed);\r\n\ttestCandidate(vec2(0.0, -stepv), bestseed);\r\n\ttestCandidate(vec2(0.0, stepv), bestseed);\r\n\ttestCandidate(vec2(stepu, -stepv), bestseed);\r\n\ttestCandidate(vec2(stepu, 0.0), bestseed);\r\n\ttestCandidate(vec2(stepu, stepv), bestseed);\r\n\t\r\n\tgl_FragColor = vec4(remap_inv(bestseed.xy), bestseed.w, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$AA.uniforms = { tDiffuse : { type : "t", value : null}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, texLevels : { type : "f", value : 0.0}, threshold : { type : "f", value : 0.0, min : 0.0, max : 1.0}};
sdf_shaders_EDT_$DISPLAY_$AA.vertexShader = "// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\t\r\n\t// Save divisions in some of the fragment shaders\r\n\toneu = 1.0 / texw;\r\n\tonev = 1.0 / texh;\r\n\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$AA.fragmentShader = "// Distance map contour texturing.\r\n// A reimplementation of Greens method, with a 16-bit 8:8 distance map and explicit bilinear interpolation.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2011.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\nuniform float threshold;\r\n\r\n// Replacement for RSLs filterstep(), with fwidth() done right.\r\n// threshold is constant, value is smoothly varying\r\nfloat aastep(float threshold, float value)\r\n{\r\n\tfloat afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));\r\n\treturn smoothstep(threshold - afwidth, threshold + afwidth, value); // GLSLs fwidth(value) is abs(dFdx(value)) + abs(dFdy(value))\r\n}\r\n\r\n// Helper functions to remap unsigned normalized floats [0.0, 1.0] coming from an integer texture to the range we need [-1, 1].\r\n// The transformations are very specifically designed to map integer texel values exactly to pixel centers, and vice versa.\r\nvec2 remap(vec2 floatdata)\r\n{\r\n\treturn floatdata * (texLevels - 1.0) / texLevels * 2.0 - 1.0;\r\n}\r\n\r\nvoid main()\r\n{\r\n\t// Scale texcoords to range ([0, texw], [0, texh])\r\n\tvec2 uv = vUv * vec2(texw, texh);\r\n\t\r\n\t// Compute texel-local (u,v) coordinates for the four closest texels\r\n\tvec2 uv00 = floor(uv - vec2(0.5)); // Lower left corner of lower left texel\r\n\tvec2 uvlerp = uv - uv00 - vec2(0.5); // Texel-local lerp blends [0,1]\r\n\t\r\n\t// Center st00 on lower left texel and rescale to [0,1] for texture lookup\r\n\tvec2 st00 = (uv00 + vec2(0.5)) * vec2(oneu, onev);\r\n\t\r\n\t// Compute distance value from four closest 8-bit RGBA texels\r\n\tvec4 T00 = texture2D(tDiffuse, st00);\r\n\tvec4 T10 = texture2D(tDiffuse, st00 + vec2(oneu, 0.0));\r\n\tvec4 T01 = texture2D(tDiffuse, st00 + vec2(0.0, onev));\r\n\tvec4 T11 = texture2D(tDiffuse, st00 + vec2(oneu, onev));\r\n\tfloat D00 = length(remap(T00.rg)) + (T00.b - 0.5) / texw;\r\n\tfloat D10 = length(remap(T10.rg)) + (T10.b - 0.5) / texw;\r\n\tfloat D01 = length(remap(T01.rg)) + (T01.b - 0.5) / texw;\r\n\tfloat D11 = length(remap(T11.rg)) + (T11.b - 0.5) / texw;\r\n\t\r\n\t// Interpolate along v\r\n\tvec2 D0_1 = mix(vec2(D00, D10), vec2(D01, D11), uvlerp.y);\r\n\t\r\n\t// Interpolate along u\r\n\tfloat D = mix(D0_1.x, D0_1.y, uvlerp.x);\r\n\t\r\n\tfloat g = aastep(threshold, D);\r\n\t\r\n\t// Final fragment color\r\n\tgl_FragColor = vec4(vec3(g), 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$OVERLAY.uniforms = { tDiffuse : { type : "t", value : null}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, texLevels : { type : "f", value : 0.0}, threshold : { type : "f", value : 0.0, min : 0.0, max : 1.0}};
sdf_shaders_EDT_$DISPLAY_$OVERLAY.vertexShader = "// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\t\r\n\t// Save divisions in some of the fragment shaders\r\n\toneu = 1.0 / texw;\r\n\tonev = 1.0 / texh;\r\n\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$OVERLAY.fragmentShader = "// Distance map contour texturing.\r\n// A reimplementation of Greens method, with a 16-bit 8:8 distance map and explicit bilinear interpolation.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2011.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\nuniform float threshold;\r\n\r\n// Replacement for RSLs filterstep(), with fwidth() done right.\r\n// threshold is constant, value is smoothly varying\r\nfloat aastep(float threshold, float value)\r\n{\r\n\tfloat afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));\r\n\treturn smoothstep(threshold - afwidth, threshold + afwidth, value); // GLSLs fwidth(value) is abs(dFdx(value)) + abs(dFdy(value))\r\n}\r\n\r\n// Helper functions to remap unsigned normalized floats [0.0, 1.0] coming from an integer texture to the range we need [-1, 1].\r\n// The transformations are very specifically designed to map integer texel values exactly to pixel centers, and vice versa.\r\nvec2 remap(vec2 floatdata)\r\n{\r\n\treturn floatdata * (texLevels - 1.0) / texLevels * 2.0 - 1.0;\r\n}\r\n\r\nvoid main()\r\n{\r\n\t// Scale texcoords to range ([0, texw], [0, texh])\r\n\tvec2 uv = vUv * vec2(texw, texh);\r\n\t\r\n\t// Compute texel-local (u,v) coordinates for the four closest texels\r\n\tvec2 uv00 = floor(uv - vec2(0.5)); // Lower left corner of lower left texel\r\n\tvec2 uvlerp = uv - uv00 - vec2(0.5); // Texel-local lerp blends [0,1]\r\n\t\r\n\t// Center st00 on lower left texel and rescale to [0,1] for texture lookup\r\n\tvec2 st00 = (uv00 + vec2(0.5)) * vec2(oneu, onev);\r\n\t\r\n\t// Compute distance value from four closest 8-bit RGBA texels\r\n\tvec4 T00 = texture2D(tDiffuse, st00);\r\n\tvec4 T10 = texture2D(tDiffuse, st00 + vec2(oneu, 0.0));\r\n\tvec4 T01 = texture2D(tDiffuse, st00 + vec2(0.0, onev));\r\n\tvec4 T11 = texture2D(tDiffuse, st00 + vec2(oneu, onev));\r\n\tfloat D00 = length(remap(T00.rg)) + (T00.b - 0.5) / texw;\r\n\tfloat D10 = length(remap(T10.rg)) + (T10.b - 0.5) / texw;\r\n\tfloat D01 = length(remap(T01.rg)) + (T01.b - 0.5) / texw;\r\n\tfloat D11 = length(remap(T11.rg)) + (T11.b - 0.5) / texw;\r\n\t\r\n\t// Interpolate along v\r\n\tvec2 D0_1 = mix(vec2(D00, D10), vec2(D01, D11), uvlerp.y);\r\n\t\r\n\t// Interpolate along u\r\n\tfloat D = mix(D0_1.x, D0_1.y, uvlerp.x);\r\n\t\r\n\tfloat g = aastep(threshold, D);\r\n\t\r\n\t// Retrieve the B channel to get the original grayscale image\r\n\tfloat c = texture2D(tDiffuse, vUv).b;\r\n\t\r\n\t// Final fragment color\r\n\tgl_FragColor = vec4(vec3(g, c, g), 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$RGB.uniforms = { tDiffuse : { type : "t", value : null}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, texLevels : { type : "f", value : 0.0}};
sdf_shaders_EDT_$DISPLAY_$RGB.vertexShader = "// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\t\r\n\t// Save divisions in some of the fragment shaders\r\n\toneu = 1.0 / texw;\r\n\tonev = 1.0 / texh;\r\n\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$RGB.fragmentShader = "// Displays the final distance field visualized as an RGB image.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\n\r\n// Helper functions to remap unsigned normalized floats [0.0, 1.0] coming from an integer texture to the range we need [-1, 1].\r\n// The transformations are very specifically designed to map integer texel values exactly to pixel centers, and vice versa.\r\nvec2 remap(vec2 floatdata)\r\n{\r\n\treturn floatdata * (texLevels - 1.0) / texLevels * 2.0 - 1.0;\r\n}\r\n\r\nvoid main()\r\n{\r\n\tvec3 texel = texture2D(tDiffuse, vUv).rgb;\r\n\tvec2 distvec = remap(texel.rg);\r\n\t\r\n    //vec2 rainbow = 0.5 + 0.5 * (normalize(distvec));\r\n    //gl_FragColor = vec4(rainbow, 1.0 - (length(distvec) + texel.b - 0.5) * 4.0, 1.0);\r\n\t\r\n\tfloat dist = length(distvec) + (texel.b - 0.5) / texw;\r\n\tgl_FragColor = vec4(vec2(mod(10.0 * dist, 1.0)), texel.b, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$GRAYSCALE.uniforms = { tDiffuse : { type : "t", value : null}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, texLevels : { type : "f", value : 0.0}, distanceFactor : { type : "f", value : 30.0}};
sdf_shaders_EDT_$DISPLAY_$GRAYSCALE.vertexShader = "// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\t\r\n\t// Save divisions in some of the fragment shaders\r\n\toneu = 1.0 / texw;\r\n\tonev = 1.0 / texh;\r\n\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$GRAYSCALE.fragmentShader = "// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\nuniform float threshold;\r\nuniform float distanceFactor;\r\n\r\n// Helper functions to remap unsigned normalized floats [0.0, 1.0] coming from an integer texture to the range we need [-1, 1].\r\n// The transformations are very specifically designed to map integer texel values exactly to pixel centers, and vice versa.\r\nvec2 remap(vec2 floatdata)\r\n{\r\n\treturn floatdata * (texLevels - 1.0) / texLevels * 2.0 - 1.0;\r\n}\r\n\r\nvoid main()\r\n{\r\n\t// Scale texcoords to range ([0, texw], [0, texh])\r\n\tvec2 uv = vUv * vec2(texw, texh);\r\n\t\r\n\t// Compute texel-local (u,v) coordinates for the four closest texels\r\n\tvec2 uv00 = floor(uv - vec2(0.5)); // Lower left corner of lower left texel\r\n\tvec2 uvlerp = uv - uv00 - vec2(0.5); // Texel-local lerp blends [0,1]\r\n\t\r\n\t// Center st00 on lower left texel and rescale to [0,1] for texture lookup\r\n\tvec2 st00 = (uv00 + vec2(0.5)) * vec2(oneu, onev);\r\n\t\r\n\t// Compute distance value from four closest 8-bit RGBA texels\r\n\tvec4 T00 = texture2D(tDiffuse, st00);\r\n\tvec4 T10 = texture2D(tDiffuse, st00 + vec2(oneu, 0.0));\r\n\tvec4 T01 = texture2D(tDiffuse, st00 + vec2(0.0, onev));\r\n\tvec4 T11 = texture2D(tDiffuse, st00 + vec2(oneu, onev));\r\n\tfloat D00 = length(remap(T00.rg)) + (T00.b - 0.5) / texw;\r\n\tfloat D10 = length(remap(T10.rg)) + (T10.b - 0.5) / texw;\r\n\tfloat D01 = length(remap(T01.rg)) + (T01.b - 0.5) / texw;\r\n\tfloat D11 = length(remap(T11.rg)) + (T11.b - 0.5) / texw;\r\n\t\r\n\t// Interpolate along v\r\n\tvec2 D0_1 = mix(vec2(D00, D10), vec2(D01, D11), uvlerp.y);\r\n\t\r\n\t// Interpolate along u\r\n\tfloat D = mix(D0_1.x, D0_1.y, uvlerp.x) * distanceFactor;\r\n\t\r\n\t// Final fragment color\r\n\tgl_FragColor = vec4(vec3(D), 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$ALPHA_$THRESHOLD.uniforms = { tDiffuse : { type : "t", value : null}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, texLevels : { type : "f", value : 0.0}, threshold : { type : "f", value : 0.0, min : 0.0, max : 1.0}};
sdf_shaders_EDT_$DISPLAY_$ALPHA_$THRESHOLD.vertexShader = "// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\t\r\n\t// Save divisions in some of the fragment shaders\r\n\toneu = 1.0 / texw;\r\n\tonev = 1.0 / texh;\r\n\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_EDT_$DISPLAY_$ALPHA_$THRESHOLD.fragmentShader = "// Distance map contour texturing.\r\n// Simple alpha thresholding, produces wavey contours.\r\n\r\n// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2011.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\nuniform float threshold;\r\n\r\n// Replacement for RSLs filterstep(), with fwidth() done right.\r\n// threshold is constant, value is smoothly varying\r\nfloat aastep(float threshold, float value)\r\n{\r\n\tfloat afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));\r\n\treturn smoothstep(threshold - afwidth, threshold + afwidth, value); // GLSLs fwidth(value) is abs(dFdx(value)) + abs(dFdy(value))\r\n}\r\n\r\nvoid main()\r\n{\r\n\t// Scale texcoords to range ([0, texw], [0, texh])\r\n\tvec2 uv = vUv * vec2(texw, texh);\r\n\t\r\n\t// Compute texel-local (u,v) coordinates for the four closest texels\r\n\tvec2 uv00 = floor(uv - vec2(0.5)); // Lower left corner of lower left texel\r\n\tvec2 uvlerp = uv - uv00 - vec2(0.5); // Texel-local lerp blends [0,1]\r\n\t\r\n\t// Center st00 on lower left texel and rescale to [0,1] for texture lookup\r\n\tvec2 st00 = (uv00 + vec2(0.5)) * vec2(oneu, onev);\r\n\t\r\n\t// Compute distance value from four closest 8-bit RGBA texels\r\n\tvec4 D00 = texture2D(tDiffuse, st00);\r\n\tvec4 D10 = texture2D(tDiffuse, st00 + vec2(oneu, 0.0));\r\n\tvec4 D01 = texture2D(tDiffuse, st00 + vec2(0.0, onev));\r\n\tvec4 D11 = texture2D(tDiffuse, st00 + vec2(oneu, onev));\r\n\r\n\t// Retrieve the B channel to get the original grayscale image\r\n\tvec4 G = vec4(D00.b, D01.b, D10.b, D11.b);\r\n  \r\n\t// Interpolate along v\r\n\tG.xy = mix(G.xz, G.yw, uvlerp.y);\r\n\r\n\t// Interpolate along u\r\n\tfloat g = mix(G.x, G.y, uvlerp.x);\r\n\r\n\tfloat c = aastep(threshold, g);\r\n\t\r\n\t// Final fragment color\r\n\tgl_FragColor = vec4(vec3(c), 1.0);\r\n}";
sdf_shaders_GaussianBlur.uniforms = { tDiffuse : { type : "t", value : null}, direction : { type : "v2", value : new THREE.Vector2(0,0)}, resolution : { type : "v2", value : new THREE.Vector2(1024.0,1024.0)}, flip : { type : "i", value : 0}};
sdf_shaders_GaussianBlur.vertexShader = "varying vec2 vUv;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
sdf_shaders_GaussianBlur.fragmentShader = "// Efficient Gaussian blur with linear sampling, based on https://github.com/Jam3/glsl-fast-gaussian-blur by Jam3\r\n// Also see http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/ by Daniel Rakos\r\n// Must use on a texture that has linear (gl.LINEAR) filtering, the linear sampling approach requires this to get info about two adjacent pixels from one texture read, making it faster than discrete sampling\r\n// Requires a horizontal and vertical pass to perform the full blur. It is written this way because a single pass involves many more texture reads\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform vec2 resolution;\r\nuniform vec2 direction;\r\nuniform int flip;\r\n\r\nvoid main()\r\n{\r\n\tvec2 uv = vUv;\r\n\t\r\n\tif(flip != 0)\r\n\t{\r\n\t\tuv.y = 1.0 - uv.y;\r\n\t}\r\n\t\r\n\tvec2 off1 = vec2(1.3846153846) * direction;\r\n\tvec2 off2 = vec2(3.2307692308) * direction;\r\n\tvec4 color = vec4(0.0);\r\n\tcolor += texture2D(tDiffuse, uv) * 0.2270270270;\r\n\tcolor += texture2D(tDiffuse, uv + (off1 / resolution)) * 0.3162162162;\r\n\tcolor += texture2D(tDiffuse, uv - (off1 / resolution)) * 0.3162162162;\r\n\tcolor += texture2D(tDiffuse, uv + (off2 / resolution)) * 0.0702702703;\r\n\tcolor += texture2D(tDiffuse, uv - (off2 / resolution)) * 0.0702702703;\r\n\tgl_FragColor = color;\r\n}";
shaders_BoxDenoise.uniforms = { tDiffuse : { type : "t", value : null}, resolution : { type : "v2", value : new THREE.Vector2(1024.0,1024.0)}, direction : { type : "f", value : 0.0}, exponent : { type : "f", value : 15.0, min : 0.0, max : 500.0}};
shaders_BoxDenoise.vertexShader = "varying vec2 vUv;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
shaders_BoxDenoise.fragmentShader = "// Denoise shader.\r\n// Smooths over grainy noise in dark images using an 9x9 box filter, weighted by color intensity, similar to a bilateral filter.\r\n\r\n// Adapted for Amsterdam Light Festival concept work by Sam Twidale.\r\n// Based on the implementation from glfx.js by Evan Wallace: https://github.com/evanw/glfx.js\r\n// This code is MIT licensed.\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform vec2 resolution;\r\nuniform float exponent;\r\nuniform float direction;\r\n\r\nvoid main() \r\n{\r\n\tvec4 center = texture2D(tDiffuse, vUv);\r\n\tvec4 color = vec4(0.0);\r\n\tfloat total = 0.0;\r\n\t\r\n\tif(direction == 0.0)\r\n\t{\r\n\t\tfor (float i = -16.0; i <= 16.0; i += 1.0)\r\n\t\t{\r\n\t\t\tvec4 sample = texture2D(tDiffuse, vUv + vec2(i, 0.0) / resolution);\r\n\t\t\tfloat weight = 1.0 - abs(dot(sample.rgb - center.rgb, vec3(0.0625)));\r\n\t\t\tweight = pow(weight, exponent);\r\n\t\t\tcolor += sample * weight;\r\n\t\t\ttotal += weight;\r\n\t\t}\r\n\t}\r\n\telse if(direction != 0.0)\r\n\t{\r\n\t\tfor (float i = -16.0; i <= 16.0; i += 1.0)\r\n\t\t{\r\n\t\t\tvec4 sample = texture2D(tDiffuse, vUv + vec2(0.0, i) / resolution);\r\n\t\t\tfloat weight = 1.0 - abs(dot(sample.rgb - center.rgb, vec3(0.0625)));\r\n\t\t\tweight = pow(weight, exponent);\r\n\t\t\tcolor += sample * weight;\r\n\t\t\ttotal += weight;\r\n\t\t}\r\n\t}\r\n\t\r\n\tgl_FragColor = color / total;\r\n}";
shaders_EDT_$DISPLAY_$DEMO.uniforms = { tDiffuse : { type : "t", value : null}, texw : { type : "f", value : 0.0}, texh : { type : "f", value : 0.0}, texLevels : { type : "f", value : 0.0}, threshold0 : { type : "f", value : 0.0, min : 0.0, max : 0.001}, threshold1 : { type : "f", value : 0.0, min : 0.0, max : 0.005}, threshold2 : { type : "f", value : 0.0, min : 0.0, max : 0.005}, threshold3 : { type : "f", value : 0.0, min : 0.0, max : 0.005}, threshold4 : { type : "f", value : 0.0, min : 0.0, max : 0.005}, angle0 : { type : "f", value : 0.0, min : -6.0, max : 6.0}, angle1 : { type : "f", value : 0.0, min : -6.0, max : 6.0}, angle2 : { type : "f", value : 0.0, min : -6.0, max : 6.0}, angle3 : { type : "f", value : 0.0, min : -6.0, max : 6.0}, angle4 : { type : "f", value : 0.0, min : -6.0, max : 6.0}, scale0 : { type : "f", value : 1.0, min : 0.0, max : 6.0}, scale1 : { type : "f", value : 1.0, min : 0.0, max : 6.0}, scale2 : { type : "f", value : 1.0, min : 0.0, max : 6.0}, scale3 : { type : "f", value : 1.0, min : 0.0, max : 6.0}, scale4 : { type : "f", value : 1.0, min : 0.0, max : 6.0}, stepThreshold0 : { type : "f", value : 0.0, min : -0.001, max : 0.001}, stepThreshold1 : { type : "f", value : 0.0, min : -0.005, max : 0.005}, stepThreshold2 : { type : "f", value : 0.0, min : -0.005, max : 0.005}, stepThreshold3 : { type : "f", value : 0.0, min : -0.005, max : 0.005}, stepThreshold4 : { type : "f", value : 0.0, min : -0.005, max : 0.005}, pattern0 : { type : "t", value : null}, pattern1 : { type : "t", value : null}, pattern2 : { type : "t", value : null}, pattern3 : { type : "t", value : null}, pattern4 : { type : "t", value : null}};
shaders_EDT_$DISPLAY_$DEMO.vertexShader = "// Adapted for three.js demo by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2010.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform float texw;\r\nuniform float texh;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\t\r\n\t// Save divisions in some of the fragment shaders\r\n\toneu = 1.0 / texw;\r\n\tonev = 1.0 / texh;\r\n\t\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
shaders_EDT_$DISPLAY_$DEMO.fragmentShader = "// Distance map contour texturing.\r\n// A reimplementation of Greens method, with a 16-bit 8:8 distance map and explicit bilinear interpolation.\r\n\r\n// Adapted for Amsterdam Light Festival concept work by Sam Twidale.\r\n// Original implementation by Stefan Gustavson 2011.\r\n// This code is in the public domain.\r\n\r\nvarying vec2 vUv;\r\nvarying float oneu;\r\nvarying float onev;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform float texw;\r\nuniform float texh;\r\nuniform float texLevels;\r\n\r\n// Distance field textures sampled for patterning\r\nuniform sampler2D pattern0;\r\nuniform sampler2D pattern1;\r\nuniform sampler2D pattern2;\r\nuniform sampler2D pattern3;\r\nuniform sampler2D pattern4;\r\n\r\n// Minimum distance for the pattern to be visible\r\nuniform float threshold0;\r\nuniform float threshold1;\r\nuniform float threshold2;\r\nuniform float threshold3;\r\nuniform float threshold4;\r\n\r\n// Angle in radians to rotate the pattern by\r\nuniform float angle0;\r\nuniform float angle1;\r\nuniform float angle2;\r\nuniform float angle3;\r\nuniform float angle4;\r\n\r\n// Thickness of the lines\r\nuniform float stepThreshold0;\r\nuniform float stepThreshold1;\r\nuniform float stepThreshold2;\r\nuniform float stepThreshold3;\r\nuniform float stepThreshold4;\r\n\r\n// Scale factor of the pattern texture\r\nuniform float scale0;\r\nuniform float scale1;\r\nuniform float scale2;\r\nuniform float scale3;\r\nuniform float scale4;\r\n\r\n// Replacement for RSLs filterstep(), with fwidth() done right.\r\n// threshold is constant, value is smoothly varying\r\nfloat aastep(float threshold, float value)\r\n{\r\n\tfloat afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));\r\n\treturn smoothstep(threshold - afwidth, threshold + afwidth, value); // GLSLs fwidth(value) is abs(dFdx(value)) + abs(dFdy(value))\r\n}\r\n\r\n// Helper functions to remap unsigned normalized floats [0.0, 1.0] coming from an integer texture to the range we need [-1, 1].\r\n// The transformations are very specifically designed to map integer texel values exactly to pixel centers, and vice versa.\r\nvec2 remap(vec2 floatdata)\r\n{\r\n\treturn floatdata * (texLevels - 1.0) / texLevels * 2.0 - 1.0;\r\n}\r\n\r\n// Samples a distance field texture\r\nfloat sampleField(vec2 uv, sampler2D tDiffuse)\r\n{\t\r\n\t// Compute texel-local (u,v) coordinates for the four closest texels\r\n\tvec2 uv00 = floor(uv - vec2(0.5)); // Lower left corner of lower left texel\r\n\tvec2 uvlerp = uv - uv00 - vec2(0.5); // Texel-local lerp blends [0,1]\r\n\t\r\n\t// Center st00 on lower left texel and rescale to [0,1] for texture lookup\r\n\tvec2 st00 = (uv00 + vec2(0.5)) * vec2(oneu, onev);\r\n\t\r\n\t// Compute distance value from four closest 8-bit RGBA texels\r\n\tvec4 T00 = texture2D(tDiffuse, st00);\r\n\tvec4 T10 = texture2D(tDiffuse, st00 + vec2(oneu, 0.0));\r\n\tvec4 T01 = texture2D(tDiffuse, st00 + vec2(0.0, onev));\r\n\tvec4 T11 = texture2D(tDiffuse, st00 + vec2(oneu, onev));\r\n\tfloat D00 = length(remap(T00.rg)) + (T00.b - 0.5) / texw;\r\n\tfloat D10 = length(remap(T10.rg)) + (T10.b - 0.5) / texw;\r\n\tfloat D01 = length(remap(T01.rg)) + (T01.b - 0.5) / texw;\r\n\tfloat D11 = length(remap(T11.rg)) + (T11.b - 0.5) / texw;\r\n\t\r\n\t// Interpolate along v\r\n\tvec2 D0_1 = mix(vec2(D00, D10), vec2(D01, D11), uvlerp.y);\r\n\t\r\n\t// Interpolate along u\r\n\tfloat D = mix(D0_1.x, D0_1.y, uvlerp.x);\r\n\t\r\n\treturn D;\r\n}\r\n\r\nvec2 rotUV(vec2 uv, float angle)\r\n{\r\n\tfloat cosFactor = cos(angle);\r\n\tfloat sinFactor = sin(angle);\r\n\tuv = (uv - texw / 2.0) * mat2(cosFactor, sinFactor, -sinFactor, cosFactor);\r\n\treturn uv + texw / 2.0;\r\n}\r\n\r\nvoid main()\r\n{\r\n\t// Scale texcoords to range ([0, texw], [0, texh])\r\n\tvec2 uv = vUv * vec2(texw, texh);\r\n\t\r\n\tfloat D = sampleField(uv, tDiffuse);\r\n\t\r\n\tfloat g0 = aastep(threshold0, D);\r\n\tfloat g1 = aastep(threshold1, D);\r\n\tfloat g2 = aastep(threshold2, D);\r\n\tfloat g3 = aastep(threshold3, D);\r\n\t\r\n\tfloat g = aastep(threshold0, D);\r\n\t\r\n\tif(vUv.y > 0.5)\r\n\t{\r\n\t\tif(g0 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold0, sampleField(rotUV(uv * scale0, angle0), pattern0))), 1.0);\r\n\t\t}\r\n\t\telse if(g1 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold1, sampleField(rotUV(uv * scale1, angle1), pattern1))), 1.0);\r\n\t\t}\r\n\t\telse if(g2 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold2, sampleField(rotUV(uv * scale2, angle2), pattern2))), 1.0);\r\n\t\t}\r\n\t\telse if(g3 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold3, sampleField(rotUV(uv * scale3, angle3), pattern3))), 1.0);\r\n\t\t}\r\n\t\telse\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);\r\n\t\t}\r\n\t}\r\n\telse\r\n\t{\r\n\t\tif(g0 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold0, sampleField(rotUV(uv * scale0, angle0), pattern1))), 1.0);\r\n\t\t}\r\n\t\telse if(g1 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold1, sampleField(rotUV(uv * scale1, angle1), pattern0))), 1.0);\r\n\t\t}\r\n\t\telse if(g2 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold2, sampleField(rotUV(uv * scale2, angle2), pattern3))), 1.0);\r\n\t\t}\r\n\t\telse if(g3 > 0.0)\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(vec3(aastep(stepThreshold3, sampleField(rotUV(uv * scale3, angle3), pattern2))), 1.0);\r\n\t\t}\r\n\t\telse\r\n\t\t{\r\n\t\t\tgl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\r\n\t\t}\r\n\t}\r\n}";
shaders_FXAA.uniforms = { tDiffuse : { type : "t", value : null}, resolution : { type : "v2", value : new THREE.Vector2(1024.0,1024.0)}};
shaders_FXAA.vertexShader = "varying vec2 vUv;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
shaders_FXAA.fragmentShader = "// Fast approximate anti-aliasing shader\r\n// Based on the three.js implementation: https://github.com/mrdoob/three.js/blob/master/examples/js/shaders/FXAAShader.js\r\n// Ported to three.js by alteredq: http://alteredqualia.com/ and davidedc: http://www.sketchpatch.net/\r\n// Ported to WebGL by @supereggbert: http://www.geeks3d.com/20110405/fxaa-fast-approximate-anti-aliasing-demo-glsl-opengl-test-radeon-geforce/\r\n// Originally implemented as NVIDIA FXAA by Timothy Lottes: http://timothylottes.blogspot.com/2011/06/fxaa3-source-released.html\r\n// Paper: http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf\r\n\r\n#define FXAA_REDUCE_MIN (1.0/128.0)\r\n#define FXAA_REDUCE_MUL (1.0/8.0)\r\n#define FXAA_SPAN_MAX 8.0\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform sampler2D tDiffuse;\r\nuniform vec2 resolution;\r\n\r\nvoid main()\r\n{\r\n\tvec2 rres = vec2(1.0) / resolution;\r\n\t\r\n\t// Texture lookups to find RGB values in area of current fragment\r\n\tvec3 rgbNW = texture2D(tDiffuse, (gl_FragCoord.xy + vec2(-1.0, -1.0)) * rres).xyz;\r\n\tvec3 rgbNE = texture2D(tDiffuse, (gl_FragCoord.xy + vec2(1.0, -1.0)) * rres).xyz;\r\n\tvec3 rgbSW = texture2D(tDiffuse, (gl_FragCoord.xy + vec2(-1.0, 1.0)) * rres).xyz;\r\n\tvec3 rgbSE = texture2D(tDiffuse, (gl_FragCoord.xy + vec2(1.0, 1.0)) * rres).xyz;\r\n\tvec4 rgbaM = texture2D(tDiffuse, gl_FragCoord.xy  * rres);\r\n\tvec3 rgbM = rgbaM.xyz;\r\n\tfloat opacity = rgbaM.w;\r\n\t\r\n\t// Luminance estimates for colors around current fragment\r\n\tvec3 luma = vec3(0.299, 0.587, 0.114);\r\n\tfloat lumaNW = dot(rgbNW, luma);\r\n\tfloat lumaNE = dot(rgbNE, luma);\r\n\tfloat lumaSW = dot(rgbSW, luma);\r\n\tfloat lumaSE = dot(rgbSE, luma);\r\n\tfloat lumaM  = dot(rgbM, luma);\r\n\tfloat lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\r\n\tfloat lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\r\n\r\n\t// \r\n\tvec2 dir;\r\n\tdir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\r\n\tdir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\r\n\r\n\tfloat dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\r\n\r\n\tfloat rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\r\n\tdir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * rres;\r\n\r\n\tvec3 rgbA = 0.5 * (texture2D(tDiffuse, gl_FragCoord.xy * rres + dir * (1.0 / 3.0 - 0.5 )).xyz + texture2D(tDiffuse, gl_FragCoord.xy * rres + dir * (2.0 / 3.0 - 0.5)).xyz);\r\n\tvec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(tDiffuse, gl_FragCoord.xy * rres + dir * -0.5).xyz + texture2D(tDiffuse, gl_FragCoord.xy * rres + dir * 0.5).xyz);\r\n\r\n\tfloat lumaB = dot(rgbB, luma);\r\n\t\r\n\tif ((lumaB < lumaMin) || (lumaB > lumaMax))\r\n\t{\r\n\t\tgl_FragColor = vec4(rgbA, opacity);\r\n\t}\r\n\telse\r\n\t{\r\n\t\tgl_FragColor = vec4(rgbB, opacity);\r\n\t}\r\n}";
shaders_Mixer.uniforms = { tLeft : { type : "t", value : null}, tRight : { type : "t", value : null}, ratio : { type : "v4", value : new THREE.Vector4(0.5,0.5,0.5,0.5)}};
shaders_Mixer.vertexShader = "varying vec2 vUv;\r\n\r\nvoid main()\r\n{\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n}";
shaders_Mixer.fragmentShader = "// Mixes two textures according to a 0-1 RGBA ratio\r\n\r\nvarying vec2 vUv;\r\n\r\nuniform sampler2D tLeft;\r\nuniform sampler2D tRight;\r\nuniform vec4 ratio;\r\n\r\nvoid main()\r\n{\r\n\tgl_FragColor = mix(texture2D(tLeft, vUv), texture2D(tRight, vUv), ratio);\r\n}";
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}}, typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this);
