uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec2 resolution;
uniform vec2 mouse;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.141592653589793238;
void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	float textureAspect = 3840.0 / 2160.0;
	float screenAspect = resolution.x / resolution.y;
	vec2 newUV = vUv;
	if (textureAspect > screenAspect) {
		newUV.x = (vUv.x - 0.5) * screenAspect / textureAspect + 0.5;
	} else {
		newUV.y = (vUv.y - 0.5) * textureAspect / screenAspect + 0.5;
	}
	// Amount of parallax effect
	float strength = 0.05;
	
	// Get the depth value from the depth texture
	float depth = texture2D(depthTexture, newUV).r;
	
	// Calculate offset based on mouse position
	vec2 offset = (mouse - 0.5) * 0.5; // Convert mouse from [0,1] to [-1,1]
	
	// Apply parallax offset based on depth
	vec2 parallaxUV = newUV - offset * depth * strength;
	
	// Sample the color texture with the parallax offset
	vec4 color = texture2D(colorTexture, parallaxUV);
	
	gl_FragColor = color;
}