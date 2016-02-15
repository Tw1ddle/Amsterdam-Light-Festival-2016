package shaders;

import util.FileReader;

import three.Vector3;

// Modified EDT_DISPLAY_AA shader with some basic demo effects, fade-in, fade-out etc
class EDT_DISPLAY_DEMO {
	public static var uniforms = {
		tDiffuse: { type: "t", value: null },
		texw: { type: "f", value: 0.0 },
		texh: { type: "f", value: 0.0 },
		texLevels: { type: "f", value: 0.0 },
		threshold0: { type: "f", value: 0.0, min: 0.0, max: 0.001 },
		threshold1: { type: "f", value: 0.0, min: 0.0, max: 0.005 },
		threshold2: { type: "f", value: 0.0, min: 0.0, max: 0.005 },
		threshold3: { type: "f", value: 0.0, min: 0.0, max: 0.005 },
		threshold4: { type: "f", value: 0.0, min: 0.0, max: 0.005 },
		pattern0: { type: "t", value: null },
		pattern1: { type: "t", value: null },
		pattern2: { type: "t", value: null },
		pattern3: { type: "t", value: null },
		pattern4: { type: "t", value: null }
	};
	public static var vertexShader = FileReader.readFile("source/shaders/edt_display_demo.vertex");
	public static var fragmentShader = FileReader.readFile("source/shaders/edt_display_demo.fragment");
}