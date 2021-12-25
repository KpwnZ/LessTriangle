#version 330 core
#extension GL_ARB_separate_shader_objects : enable

#define MAX_STEP 100
#define MAX_DISTANCE 100
#define SURFACE 0.001
#define DEBUG_SDF false

out vec4 FragColor;  // gl style...
uniform ivec2 resolution;

// geometry
vec2 sphere(vec3 v, vec3 p, float r, int mat_id);
vec2 cube(vec3 v, vec3 p, vec3 size, int mat_id);
vec2 rounded_cube(vec3 v, vec3 p, vec3 size, float r, int mat_id);

// light
const float daylight_ambient = 0.8;
const float nightlight_ambient = 0.1;
vec3 ambient_light(vec3, vec3, float);
vec3 diffusion_light(vec3, vec3, vec3, vec3, float, float);

// SDF
vec2 union_sdf(vec2 sdf1, vec2 sdf2);
vec2 intersection_sdf(vec2 sdf1, vec2 sdf2);
vec2 substraction_sdf(vec2 sdf1, vec2 sdf2);
vec2 smooth_union_sdf(vec2 sdf1, vec2 sdf2, float k);
vec2 smooth_intersection_sdf(vec2 sdf1, vec2 sdf2, float k);
vec2 smooth_substraction_sdf(vec2 sdf1, vec2 sdf2, float k);

// transform
vec3 rotate_x(vec3 v, float angle);
vec3 rotate_y(vec3 v, float angle);
vec3 rotate_z(vec3 v, float angle);
vec3 rotate(vec3 v, vec3 n, float angle);

// color
#define SKY normalize_rgb(vec3(199, 235, 237))
#define GROUND normalize_rgb(vec3(182, 128, 115))
#define GRASS normalize_rgb(vec3(193, 222, 129))

vec3 normalize_rgb(vec3 rgb) {
    return rgb / 255.0;
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// material
struct Material {
    vec3 ambient_color;
    vec3 diffuse_color;
    float k_d;
    // bool is_lighting;
    // vec3 light_color;
    // vec3 light_pos;
};

struct LightSource {
    vec3 light_pos;
    vec3 light_color;
    float intensity;
};

// add new material here,
// pass the index to sdf method as material id
Material materials[3] = Material[3](
    // ground id 0
    Material(
        GROUND,
        GROUND,
        0.8
    ),
    // grass id 1
    Material(
        GRASS,
        GRASS,
        0.9
    ),
    Material(
        normalize_rgb(vec3(201, 203, 45)),
        normalize_rgb(vec3(201, 203, 45)),
        0.0)
);

LightSource light_sources[2] = LightSource[2](
    LightSource(
        vec3(-1.5, 1, 0),
        vec3(1.0, 1.0, 1.0),
        1.3),
    LightSource(
        vec3(1.5, 1, 1.5),
        vec3(1.0, 1.0, 1.0),
        1.3)
);

vec2 grass_block(vec3 v, vec3 p, float extent, float height) {
    vec2 block = union_sdf(
        cube(v, vec3(p.x, p.y + height / 2, p.z), vec3(extent, height, extent), 0),
        cube(v, vec3(p.x, p.y + height + 0.01 / 2, p.z), vec3(extent, 0.01, extent), 1));
    return block;
}

vec2 tree_block(vec3 v, vec3 p, float height) {
    // trunk
    vec2 main_trunk = cube(v, vec3(p.x, p.y + height / 2, p.z), vec3(0.08, height, 0.08), 0);
    main_trunk = union_sdf(
        main_trunk,
        cube(v, vec3(p.x + height / 6, p.y + height / 3 * 2, p.z), vec3(height / 3, 0.08, 0.08), 0)
    );
    main_trunk = union_sdf(
        main_trunk,
        cube(v, vec3(p.x + height / 3 - 0.04, p.y + height / 3 * 2 + 0.08, p.z), vec3(0.08, 0.16, 0.08), 0)
    );
    main_trunk = union_sdf(
        main_trunk,
        cube(v, vec3(p.x - height / 6, p.y + height / 3 * 2 + 0.08, p.z), vec3(0.08, 0.16, 0.08), 0)
    );
    // main_trunk = union_sdf(
    //     main_trunk,
    //     cube(v, vec3(p.x + height / 3 - 0.04, p.y + height / 3 * 2 + 0.08, p.z), vec3(0.08, 0.16, 0.08), 0)
    // );

    // leaves
    float n1 = 0.25;
    vec2 top_leaves = cube(v, vec3(p.x, p.y + height + n1 / 2, p.z), vec3(n1, n1, n1), 1);
    n1 -= 0.06;
    top_leaves = union_sdf(
        top_leaves,
        cube(v, vec3(p.x + height / 3 + 0.03, p.y + height / 3 * 2 + 0.16, p.z), vec3(n1, n1, n1), 1)
    );
    top_leaves = union_sdf(
        top_leaves,
        cube(v, vec3(p.x - height / 3 - 0.03, p.y + height / 3 * 2 + 0.16, p.z), vec3(n1+0.03, n1, n1+0.03), 1)
    );
    n1 += 0.05;
    top_leaves = union_sdf(
        top_leaves,
        cube(v, vec3(p.x, p.y + height / 3 * 2 + 0.12, p.z - height / 3 - 0.08), vec3(n1+0.03, n1, n1+0.03), 1)
    );
    n1 += 0.03;
    top_leaves = union_sdf(
        top_leaves,
        cube(v, vec3(p.x, p.y + height / 3 * 2 + 0.10, p.z + height / 3 + 0.06), vec3(n1, n1, n1), 1)
    );

    main_trunk = union_sdf(main_trunk, top_leaves);
    return main_trunk;
}

/**
 * scene sdf, construct the scene here with geometric primitives
 *
 * @param[in] vector  Ray vector
 *
 * @return Distance from the ray to the scene
 */
vec2 scene(vec3 v) {
    vec2 ground = grass_block(v, vec3(0, -0.2, 0), 3, 0.3);
    vec2 res = ground;
    for (int i = 0; i <= 3; ++i) {
        for (int j = 0; j <= 3 - i + 1; ++j) {
            int h = (3 - i + 1 - j);
            if(h == 4) h = 3;
            res = union_sdf(
                res,
                grass_block(v, vec3(-1.5+(2 * i + 1) * 0.15, 0.1, 1.5-(2 * j + 1) * 0.15), 0.3, h * 0.125)
            );
        }
    }
    res = union_sdf(
        res,
        grass_block(v, vec3(1, 0.1, 1), 1, 0.15)
    );
    res = union_sdf(
        res,
        grass_block(v, vec3(1.25, 0.25, 1.25), 0.5, 0.15)
    );
    res = union_sdf(
        res,
        //sphere(v, vec3(0, 0, 0), 1, 0)
        tree_block(v, vec3(-1.5 + 0.15, 0.375+0.1, 1.5 - 0.15), 0.5)
    );
    res = union_sdf(
        res,
        cube(v, light_sources[0].light_pos, vec3(0.1), 2)
    );

    vec2 pan = smooth_intersection_sdf(
        sphere(v, vec3(0, 0, -2.5), 0.5, 2), 
        sphere(v, vec3(0, 0, -2), 0.5, 2),
        0.1
    );
    
    res = union_sdf(
        res,
        pan
    );

    return vec2(
        res.x,
        res.y);
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
    return vec2(depth, res.y);
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
        FragColor = vec4(SKY, 1);
    } else {
        vec3 p = ro + rd * dist;
        // vec3 light_position = vec3(0, 3, -3);

        // TODO: add lighting
        vec3 dif_color = vec3(0);
        // for (int i = 0; i < 2; ++i) {
        //     LightSource ls = light_sources[i];
        //     float light_dist = length(ls.light_pos - p);
        //     float attenuation = 1.0 / (1.0 + 0.7 * light_dist + 1.80 * light_dist * light_dist);
        //     dif_color += diffusion_light(
        //         p, ls.light_pos,
        //         ls.light_color, hit_material.diffuse_color,
        //         hit_material.k_d, ls.intensity) * attenuation;
        // }
        // for (int i = 0; i < 2; ++i) {
        //     LightSource ls = light_sources[i];
        //     // find shadow
        //     vec3 n = normal(p);
        //     vec3 light_dir = normalize(ls.light_pos - p);
        //     vec2 shadow_res = ray_march(p + n * 0.001, light_dir);
        //     // without the n * eps, the ray will be blocked by the surface
        //     vec2 light_res = ray_march(ls.light_pos, -light_dir);
        //     float shadow_dist = shadow_res.x;
        //     if (shadow_res.x + 2 * abs(light_res.x)< length(ls.light_pos - p)) {
        //         dif_color *= 0.3;
        //     }
        // }
        dif_color += ambient_light(hit_material.ambient_color, vec3(1, 1, 1), daylight_ambient);

        if (DEBUG_SDF) {
            FragColor = vec4(vec3(dist / 5.0), 1.0);
        } else {
            FragColor = vec4(dif_color, 1.0);
        }
    }
}
