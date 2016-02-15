package shaders;

import three.Vector2;
import util.FileReader;

class FreiChen {	
	public static var uniforms = {
		tDiffuse: { type: "t", value: null },
		resolution: { type: "v2", value: new Vector2(1024.0, 1024.0) }
	};
	public static var vertexShader = FileReader.readFile("source/shaders/checker.vertex");
	public static var fragmentShader = FileReader.readFile("source/shaders/freichen.fragment");
}