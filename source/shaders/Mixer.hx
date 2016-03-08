package shaders;

import three.Vector2;
import util.FileReader;
import three.Vector4;

class Mixer {	
	public static var uniforms = {
		tLeft: { type: "t", value: null },
		tRight: { type: "t", value: null },
		ratio: { type: "v4", value: new Vector4(0.5, 0.5, 0.5, 0.5) }
	};
	public static var vertexShader = FileReader.readFile("source/shaders/passthrough.vertex");
	public static var fragmentShader = FileReader.readFile("source/shaders/mixer.fragment");
}