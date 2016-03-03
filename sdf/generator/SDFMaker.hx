package sdf.generator;

import sdf.shaders.Copy;
import sdf.shaders.EDT.EDT_FLOOD;
import sdf.shaders.EDT.EDT_SEED;
import sdf.shaders.GaussianBlur;
import three.Mesh;
import three.OrthographicCamera;
import three.PixelFormat;
import three.PlaneGeometry;
import three.Scene;
import three.ShaderMaterial;
import three.Texture;
import three.TextureDataType;
import three.TextureFilter;
import three.WebGLRenderer;
import three.WebGLRenderTarget;
import three.WebGLRenderTargetOptions;
import three.Wrapping;

class SDFMaker {
	public var texLevels(default, null):Float;
	
	private var renderer:WebGLRenderer;
	private var scene(default, null):Scene;
	private var camera(default, null):OrthographicCamera;
	
	private var renderTargetParams:WebGLRenderTargetOptions;
	
	private var blurMaterial:ShaderMaterial; // Material for performing optional initial blur on the input texture
	private var seedMaterial:ShaderMaterial; // Material for creating the initial seed texture
	private var floodMaterial:ShaderMaterial; // Material for performing the EDT
	
	/*
	private var copyMaterial:ShaderMaterial; // Material for copying the finalized texture elsewhere
	*/
	
	public function new(renderer:WebGLRenderer) {		
		texLevels = 256.0;
		
		this.renderer = renderer;
		
		scene = new Scene();
		scene.add(new Mesh(new PlaneGeometry(1, 1)));
		
		camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);
		camera.updateProjectionMatrix();
		
		blurMaterial = new ShaderMaterial( {
			vertexShader: GaussianBlur.vertexShader,
			fragmentShader: GaussianBlur.fragmentShader,
			uniforms: GaussianBlur.uniforms
		});
		
		seedMaterial = new ShaderMaterial({
			vertexShader: EDT_SEED.vertexShader,
			fragmentShader: EDT_SEED.fragmentShader,
			uniforms: EDT_SEED.uniforms,
			transparent: true
		});
		
		floodMaterial = new ShaderMaterial({
			vertexShader: EDT_FLOOD.vertexShader,
			fragmentShader: EDT_FLOOD.fragmentShader,
			uniforms: EDT_FLOOD.uniforms
		});
		
		/*
		copyMaterial = new ShaderMaterial( {
			vertexShader: Copy.vertexShader,
			fragmentShader: Copy.fragmentShader,
			uniforms: Copy.uniforms
		});
		*/
		
		renderTargetParams = {
			minFilter: TextureFilter.NearestFilter,
			magFilter: TextureFilter.NearestFilter,
			wrapS: Wrapping.ClampToEdgeWrapping,
			wrapT: Wrapping.ClampToEdgeWrapping,
			format: cast PixelFormat.RGBAFormat,
			stencilBuffer: false,
			depthBuffer: false,
			type: TextureDataType.UnsignedByteType
		};
	}
	
	inline public function transformRenderTarget(target:WebGLRenderTarget, ?ping:WebGLRenderTarget, ?pong:WebGLRenderTarget, blurIterations:Int = 1):WebGLRenderTarget {
		return transform(target, target.width, target.height, ping, pong, blurIterations);
	}
	
	// Performs EDT on the texture, returning a render target with the result
	inline public function transformTexture(target:Texture, ?ping:WebGLRenderTarget, ?pong:WebGLRenderTarget, blurIterations:Int = 1):WebGLRenderTarget {
		return transform(target, target.image.width, target.image.height, ping, pong, blurIterations);
	}
	
	public function blur(texture:Dynamic, width:Float, height:Float, ping:WebGLRenderTarget, pong:WebGLRenderTarget, blurIterations:Int):WebGLRenderTarget {
		// Perform small Gaussian blur on the input, reducing the wavey or blockiness or poorly AA'd input images at the cost of the accuracy of the original shape
		scene.overrideMaterial = blurMaterial;
		blurMaterial.uniforms.resolution.value.set(width, height);
		
		texture.minFilter = TextureFilter.LinearFilter;
		texture.magFilter = TextureFilter.LinearFilter;
		texture.wrapS = Wrapping.RepeatWrapping;
		texture.wrapT = Wrapping.RepeatWrapping;
		
		ping.minFilter = TextureFilter.LinearFilter;
		ping.magFilter = TextureFilter.LinearFilter;
		ping.wrapS = Wrapping.RepeatWrapping;
		ping.wrapT = Wrapping.RepeatWrapping;
		
		pong.minFilter = TextureFilter.LinearFilter;
		pong.magFilter = TextureFilter.LinearFilter;
		pong.wrapS = Wrapping.RepeatWrapping;
		pong.wrapT = Wrapping.RepeatWrapping;
		
		var iterations = blurIterations;
		var tmp:Dynamic = null;
		
		blurMaterial.uniforms.flip.value = 1;
		for (i in 0...iterations) {
			var radius = iterations - i - 1;
			
			if (i == 0) {
				tmp = ping;
				blurMaterial.uniforms.tDiffuse.value = texture;
				blurMaterial.uniforms.direction.value.set(radius, 0); // Horizontal blur
			} else if (i % 2 != 0) {
				tmp = pong;
				blurMaterial.uniforms.tDiffuse.value = ping;
				blurMaterial.uniforms.direction.value.set(0, radius); // Vertical blur
			} else {
				tmp = ping;
				blurMaterial.uniforms.tDiffuse.value = pong;
				blurMaterial.uniforms.direction.value.set(radius, 0); // Horizontal blur
			}
			renderer.render(scene, camera, tmp, true);
		}
		
		// Render final texture to next target
		var source = ping;
		var target = pong;
		blurMaterial.uniforms.flip.value = 1;
		blurMaterial.uniforms.direction.value.set(0, 0); // Copy
		blurMaterial.uniforms.tDiffuse.value = source;
		renderer.render(scene, camera, target, true);
		
		texture.wrapS = Wrapping.ClampToEdgeWrapping;
		texture.wrapT = Wrapping.ClampToEdgeWrapping;
		texture.minFilter = TextureFilter.NearestFilter;
		texture.magFilter = TextureFilter.NearestFilter;
		
		ping.wrapS = Wrapping.ClampToEdgeWrapping;
		ping.wrapT = Wrapping.ClampToEdgeWrapping;
		ping.minFilter = TextureFilter.NearestFilter;
		ping.magFilter = TextureFilter.NearestFilter;
		
		pong.wrapS = Wrapping.ClampToEdgeWrapping;
		pong.wrapT = Wrapping.ClampToEdgeWrapping;
		pong.minFilter = TextureFilter.NearestFilter;
		pong.magFilter = TextureFilter.NearestFilter;
		
		/*
		// Test to display the blurred input texture
		scene.overrideMaterial = copyMaterial;
		copyMaterial.uniforms.tDiffuse.value = pong;
		renderer.render(scene, camera);
		*/
		
		return target;
	}
	
	private function transform(texture:Dynamic, width:Float, height:Float, ?ping:WebGLRenderTarget, ?pong:WebGLRenderTarget, blurIterations:Int):WebGLRenderTarget {
		#if debug
		var start = haxe.Timer.stamp();
		#end
		
		if (ping == null) {
			ping = new WebGLRenderTarget(width, height);
		}
		if (pong == null) {
			pong = new WebGLRenderTarget(width, height);
		}
		
		// Draw seed image to first render target
		var source:Dynamic = null;
		var target:Dynamic = null;
		if (blurIterations > 0) {
			source = blur(texture, width, height, ping, pong, blurIterations);
			source == ping ? target = pong : target = ping;
		} else {
			source = texture;
			target = ping;
		}
		
		scene.overrideMaterial = seedMaterial;
		seedMaterial.uniforms.tDiffuse.value = source;
		seedMaterial.uniforms.texLevels.value = texLevels;
		renderer.render(scene, camera, target, true);
		
		// Iteratively calculate the euclidean distance transform, ping-ponging results into the render targets
		scene.overrideMaterial = floodMaterial;
		floodMaterial.uniforms.texLevels.value = texLevels;
		floodMaterial.uniforms.texw.value = width;
		floodMaterial.uniforms.texh.value = height;
		var stepSize:Int = width > height ? Std.int(width / 2) : Std.int(height / 2);
		var last = target;
		while (stepSize > 0) {				
			floodMaterial.uniforms.tDiffuse.value = last;
			floodMaterial.uniforms.step.value = stepSize;
			
			last == ping ? last = pong : last = ping;
			
			renderer.render(scene, camera, last, true);
			
			stepSize = Std.int(stepSize / 2);
			
			/*
			// Test to display the work-in-progress texture as the jump flooding algorithm iterates
			scene.overrideMaterial = copyMaterial;
			copyMaterial.uniforms.tDiffuse.value = last;
			renderer.render(scene, camera);
			scene.overrideMaterial = floodMaterial;
			*/
		}
		
		/*
		// Test to display the final result using the direct copy shader
		scene.overrideMaterial = copyMaterial;
		copyMaterial.uniforms.tDiffuse.value = last;
		renderer.render(scene, camera);
		*/
		
		scene.overrideMaterial = null;
		
		// Destroy the spare render target, retain the one with the result
		if (last != ping) {
			ping.dispose();
		}
		if (last != pong) {
			pong.dispose();
		}
		
		#if debug
		var duration = haxe.Timer.stamp() - start;
		trace("Transform duration: " + duration);
		#end
		
		return last;
	}
}