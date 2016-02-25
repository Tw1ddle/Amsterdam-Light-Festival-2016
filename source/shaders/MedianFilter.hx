package shaders;

import three.Vector2;
import util.FileReader;

// 5x5 median filter
class MedianFilter {
	public static var uniforms = {
		tDiffuse: { type: "t", value: null },
		resolution: { type: "v2", value: new Vector2(1024.0, 1024.0) }
	};
	public static var vertexShader = FileReader.readFile("source/shaders/passthrough.vertex");
	public static var fragmentShader = FileReader.readFile("source/shaders/median55.fragment");
}