#version 330 core

#define MAX_STEP 100
#define MAX_DISTANCE 100
#define SURFACE 0.001

out vec4 FragColor;
uniform vec2 resolution;

// geometry
vec4 sphere_sdf(vec3 v, vec3 p, float r, vec3 color);
// light
vec3 ambient_light(vec3 color, float strength);
vec3 diffusion_light(
    vec3 p, vec3 light_pos,
    vec3 light_color,
    vec3 diffuse_color, float k_d);

vec4 min4(vec4 a, vec4 b) {
    if (a.x < b.x) {
        return a;
    }
    return b;
}

/**
 * scene sdf, construct the scene here with geometric primitives
 *
 * @param[in] vector  Ray vector
 *
 * @return Distance from the ray to the scene
 */
vec4 scene(vec3 v) {
    vec4 sdf1 = sphere_sdf(v, vec3(0, 0, 5), 1.0, vec3(1, 0, 0));
    vec4 sdf2 = sphere_sdf(v, vec3(1, 2, 5), 1.0, vec3(0, 1, 0));
    vec4 sdf3 = sphere_sdf(v, vec3(-1, 2, 5), 1.0, vec3(0, 0, 1));
    vec4 res = min4(sdf1, sdf2);
    res = min4(res, sdf3);
    return vec4(
        res.x,
        res.yzw
    );
}

/**
 * Normal of a given point in the scene
 * 
 * @param[in] Point  The point to compute the normal for
 */
vec3 normal(vec3 p) {
    const float eps = 0.00001;
    return normalize(vec3(
        scene(vec3(p.x + eps, p.y, p.z)).x - scene(vec3(p.x - eps, p.y, p.z)).x,
        scene(vec3(p.x, p.y + eps, p.z)).x - scene(vec3(p.x, p.y - eps, p.z)).x,
        scene(vec3(p.x, p.y, p.z + eps)).x - scene(vec3(p.x, p.y, p.z - eps)).x));
}

/**
 * ray marching, with ray direction from start
 * iterate MAX_STEP times to find the closest distance
 *
 * @param[in] start  Origin of the ray
 * @param[in] dir    Direction of the ray
 *
 * @return Distance from the ray to the scene
 */
vec4 ray_march(vec3 start, vec3 dir) {
    float depth = 0.0;
    vec4 res;
    for (int i = 0; i < MAX_STEP; ++i) {
        vec3 p = start + dir * depth;
        res = scene(p);
        float dist = res.x;
        depth += dist;
        if (depth > MAX_DISTANCE || dist < SURFACE) {
            // depth > MAX_DISTANCE means the ray is too far
            // dist < SURFACE means the ray is very close to the surface,
            // which can be returned.
            break;
        }
    }
    return vec4(
        depth,
        res.yzw);
}

// float get_dist() {
//     FragColor = vec4(1.0, 0.0, 0.0, 1.0);
//     return 0.0;
// }

void main() {
    // FragColor = vec4(0.5, 0.6, 0.7, 1.0);
    vec2 uv = (gl_FragCoord.xy - resolution.xy) / resolution.x;
    vec3 ro = vec3(0, 0, 0);
    vec3 rd = normalize(vec3(uv.x, uv.y, 1.));

    vec4 res = ray_march(ro, rd);
    float dist = res.x;
    if (dist >= MAX_DISTANCE - 0.001) {
        FragColor = vec4(1, 1, 1, 1);
    } else {
        vec3 p = ro + rd * dist;
        vec3 n = normal(p);
        vec3 lightPosition = vec3(0, 0, 3);

        vec3 dif_color = diffusion_light(
            p, lightPosition,
            vec3(1, 1, 1), res.yzw, 0.9);

        FragColor = vec4(dif_color, 1.0);
    }
}