package shaders;

import three.Vector2;
import util.FileReader;

class BoxDenoise {	
	public static var uniforms = {
		tDiffuse: { type: "t", value: null },
		resolution: { type: "v2", value: new Vector2(1024.0, 1024.0) },
		direction: { type: "f", value: 0.0 },
		exponent: { type: "f", value: 15.0, min: 0.0, max: 500.0 }
	};
	public static var vertexShader = FileReader.readFile("source/shaders/passthrough.vertex");
	public static var fragmentShader = FileReader.readFile("source/shaders/boxdenoise.fragment");
}