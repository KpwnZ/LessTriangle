#version 330 core
#extension GL_ARB_separate_shader_objects : enable

#define MAX_STEP     100
#define MAX_DISTANCE 100
#define SURFACE      0.001
#define DEBUG_SDF    false

out vec4 FragColor; // gl style...
uniform ivec2 resolution;

// geometry
vec2 sphere(vec3 v, vec3 p, float r, int mat_id);
vec2 cube(vec3 v, vec3 p, vec3 size, int mat_id);
vec2 rounded_cube(vec3 v, vec3 p, vec3 size, float r, int mat_id);

// light
vec3 ambient_light(vec3, vec3, float);
vec3 diffusion_light(vec3, vec3, vec3, vec3, float);

// SDF
vec2 union_sdf(vec2 sdf1, vec2 sdf2);

// transform
vec3 rotate_x(vec3 v, float angle);
vec3 rotate_y(vec3 v, float angle);
vec3 rotate_z(vec3 v, float angle);

// color
#define GROUND vec3(0.678, 0.506, 0.455)
#define GRASS normalize_rgb(vec3(193, 222, 129))

vec3 normalize_rgb(vec3 rgb) {
    return rgb / 255.0;
}

// material
struct Material {
    vec3 ambient_color;
    vec3 diffuse_color;
    float k_d;
    bool is_lighting;
    vec3 light_color;
    vec3 light_pos;
};

// add new material here, 
// pass the index to sdf method as material id
Material materials[2] = Material[2](
    // ground id 0
    Material(
        GROUND,
        GROUND,
        1.0,
        false,
        vec3(0.0),
        vec3(0.0)
    ),
    // grass id 1
    Material(
        GRASS,
        GRASS,
        1.0,
        true,
        vec3(0.0),
        vec3(0.0)
    )
);

vec2 grass_block(vec3 v, vec3 p, float extent, float height) {
    vec2 block = union_sdf(
        cube(v, vec3(p.x, p.y + height / 2, p.z), vec3(extent, height, extent), 0),
        cube(v, vec3(p.x, p.y + height + 0.01 / 2, p.z), vec3(extent, 0.01, extent), 1));
    return block;
}

// vec4 tree_block(vec3 v, vec3 p, float scale) {

// }

/**
 * scene sdf, construct the scene here with geometric primitives
 *
 * @param[in] vector  Ray vector
 *
 * @return Distance from the ray to the scene
 */
vec2 scene(vec3 v) {
    vec2 ground = grass_block(v, vec3(0, -0.1, 0), 3, 0.2);
    vec2 res = ground;
    for(int i = 0; i <= 3; ++i) {
        for(int j = 0; j <= i; ++j) {
            res = union_sdf(res, grass_block(v, vec3(((j * 2) + 1) * 0.125 - 1.5, 0.1, (((i - j) * 2) + 1) * 0.125 - 1.5), 0.25, (3 - i)*0.125));
        }
    }

    return vec2(
        res.x,
        res.y
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
vec2 ray_march(vec3 start, vec3 dir) {
    float depth = 0.0;
    vec2 res;
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
    return vec2(
        depth,
        res.y);
}

/**
 * Calculate the transform matrix for ray direction, similar to lookat()
 * 
 * @param[in] Postion    Camera position
 * @param[in] Up         Up direction
 * @param[in] Target     Target position
 *
 * @return Transform matrix
 */
mat3 camera_mat(vec3 p, vec3 up, vec3 t) {
    vec3 direction = normalize(p - t);
    vec3 r = normalize(cross(up, direction));
    vec3 y = normalize(cross(direction, r));
    return mat3(-r, y, -direction);
}

void main() {
    // FragColor = vec4(0.5, 0.6, 0.7, 1.0);
    vec2 __resolution = resolution;
    vec2 ratio = vec2(__resolution.x / __resolution.y, 1.0);
    vec2 uv = ratio * (gl_FragCoord.xy / __resolution.xy - 0.5);
    vec3 ro = vec3(3, 3, -3);
    mat3 cm = camera_mat(ro, vec3(0, 1, 0), vec3(0, 0, 0));
    vec3 rd = cm * normalize(vec3(uv.x, uv.y, 1.));

    vec2 res = ray_march(ro, rd);
    float dist = res.x;
    Material hit_material = materials[int(res.y)];
    if (dist >= MAX_DISTANCE - 0.001) {
        FragColor = vec4(1, 1, 1, 1);
    } else {
        vec3 p = ro + rd * dist;
        vec3 n = normal(p);
        vec3 light_position = vec3(0, 3, -3);

        // TODO: add lighting
        // vec3 dif_color = diffusion_light(
        //     p, light_position,
        //     vec3(1, 1, 1), res.yzw, 0.7);

        // vec3 color = dif_color + ambient_light(res.yzw, vec3(1, 1, 1), 1);
        if(DEBUG_SDF) {
            FragColor = vec4(vec3(dist/5.0), 1.0);
        } else {
            FragColor = vec4(hit_material.diffuse_color, 1.0);
        }
    }
}

