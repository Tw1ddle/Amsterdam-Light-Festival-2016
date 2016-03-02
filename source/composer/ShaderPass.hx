package composer;

import three.OrthographicCamera;
import three.WebGLRenderer;
import three.Scene;
import three.ShaderMaterial;

@:native("THREE.ShaderPass") extern class ShaderPass {
	public function new(shader:Dynamic, ?textureID:Dynamic):Void;
	public function render(renderer:WebGLRenderer, writeBuffer:Dynamic, readBuffer:Dynamic, dt:Float):Void;
	
	public var textureID:Int;
	public var uniforms:Dynamic;
	public var material:ShaderMaterial;
	public var renderToScreen:Bool;
	public var enabled:Bool;
	public var needsSwap:Bool;
	public var clear:Bool;
	public var camera:OrthographicCamera;
	public var scene:Scene;
}