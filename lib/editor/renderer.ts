import type { Adjustments } from './types'

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAGMENT = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_image;
uniform vec2 u_texel;
uniform float u_exposure;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_temperature;
uniform float u_tint;
uniform float u_saturation;
uniform float u_vibrance;
uniform float u_hue;
uniform float u_sepia;
uniform float u_fade;
uniform float u_sharpen;
uniform float u_blur;
uniform float u_vignette;
uniform float u_grain;
uniform float u_aspect;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 tex = texture2D(u_image, v_uv);
  vec3 c = tex.rgb;

  if (u_blur > 0.0) {
    vec3 sum = vec3(0.0);
    float total = 0.0;
    for (int x = -3; x <= 3; x++) {
      for (int y = -3; y <= 3; y++) {
        vec2 off = vec2(float(x), float(y)) * u_texel * u_blur;
        float w = exp(-float(x * x + y * y) / 8.0);
        sum += texture2D(u_image, v_uv + off).rgb * w;
        total += w;
      }
    }
    c = sum / total;
  }

  if (u_sharpen > 0.0) {
    vec3 n = texture2D(u_image, v_uv + vec2(u_texel.x, 0.0)).rgb
      + texture2D(u_image, v_uv - vec2(u_texel.x, 0.0)).rgb
      + texture2D(u_image, v_uv + vec2(0.0, u_texel.y)).rgb
      + texture2D(u_image, v_uv - vec2(0.0, u_texel.y)).rgb;
    c += (tex.rgb * 4.0 - n) * u_sharpen;
  }

  c *= pow(2.0, u_exposure);
  c += u_brightness;
  c = (c - 0.5) * (1.0 + u_contrast) + 0.5;

  float l = luma(clamp(c, 0.0, 1.0));
  float shadowMask = 1.0 - smoothstep(0.0, 0.55, l);
  float highlightMask = smoothstep(0.45, 1.0, l);
  c += u_shadows * 0.35 * shadowMask;
  c += u_highlights * 0.35 * highlightMask;

  c.r += u_temperature * 0.12;
  c.b -= u_temperature * 0.12;
  c.g -= u_tint * 0.1;
  c = clamp(c, 0.0, 1.0);

  l = luma(c);
  c = mix(vec3(l), c, 1.0 + u_saturation);

  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  c = mix(vec3(luma(c)), c, 1.0 + u_vibrance * (1.0 - (mx - mn)));

  if (u_hue != 0.0) c = hueShift(c, u_hue);

  vec3 sep = vec3(
    dot(c, vec3(0.393, 0.769, 0.189)),
    dot(c, vec3(0.349, 0.686, 0.168)),
    dot(c, vec3(0.272, 0.534, 0.131))
  );
  c = mix(c, sep, u_sepia);

  c = mix(c, c * 0.78 + 0.14, u_fade);

  vec2 d = (v_uv - 0.5) * vec2(u_aspect, 1.0) / max(u_aspect, 1.0);
  float v = smoothstep(0.85, 0.25, length(d) * 1.2);
  if (u_vignette > 0.0) c *= mix(1.0, v, u_vignette);
  else c = mix(c, vec3(1.0), (1.0 - v) * -u_vignette);

  if (u_grain > 0.0) c += (rand(gl_FragCoord.xy) - 0.5) * u_grain * 0.3;

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), tex.a);
}
`

const UNIFORMS = [
  'exposure',
  'brightness',
  'contrast',
  'highlights',
  'shadows',
  'temperature',
  'tint',
  'saturation',
  'vibrance',
  'hue',
  'sepia',
  'fade',
  'sharpen',
  'blur',
  'vignette',
  'grain',
] as const

function toShaderValues(a: Adjustments): Record<(typeof UNIFORMS)[number], number> {
  return {
    exposure: (a.exposure / 100) * 1.5,
    brightness: (a.brightness / 100) * 0.3,
    contrast: a.contrast / 100,
    highlights: a.highlights / 100,
    shadows: a.shadows / 100,
    temperature: a.temperature / 100,
    tint: a.tint / 100,
    saturation: a.saturation / 100,
    vibrance: a.vibrance / 100,
    hue: (a.hue * Math.PI) / 180,
    sepia: a.sepia / 100,
    fade: a.fade / 100,
    sharpen: (a.sharpen / 100) * 1.2,
    blur: (a.blur / 100) * 4,
    vignette: a.vignette / 100,
    grain: a.grain / 100,
  }
}

export class ImageRenderer {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private texture: WebGLTexture
  private locations = new Map<string, WebGLUniformLocation | null>()
  private width = 1
  private height = 1
  readonly maxSize: number

  constructor(canvas: HTMLCanvasElement = document.createElement('canvas')) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false })
    if (!gl) throw new Error('WebGL is not supported in this browser.')
    this.gl = gl
    this.maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number

    const program = gl.createProgram()!
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'Shader link failed')
    }
    this.program = program
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    this.texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    for (const name of [...UNIFORMS, 'texel', 'aspect', 'image']) {
      this.locations.set(name, gl.getUniformLocation(program, `u_${name}`))
    }
  }

  private compile(type: number, source: string) {
    const gl = this.gl
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compile failed')
    }
    return shader
  }

  setSource(source: TexImageSource & { width: number; height: number }) {
    const gl = this.gl
    this.width = source.width
    this.height = source.height
    this.canvas.width = source.width
    this.canvas.height = source.height
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  }

  render(adjustments: Adjustments) {
    const gl = this.gl
    gl.viewport(0, 0, this.width, this.height)
    gl.useProgram(this.program)
    const values = toShaderValues(adjustments)
    for (const name of UNIFORMS) gl.uniform1f(this.locations.get(name)!, values[name])
    gl.uniform2f(this.locations.get('texel')!, 1 / this.width, 1 / this.height)
    gl.uniform1f(this.locations.get('aspect')!, this.width / this.height)
    gl.uniform1i(this.locations.get('image')!, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
