#version 330 core
#extension GL_ARB_separate_shader_objects : enable

#define MAX_STEP 100
#define MAX_DISTANCE 100
#define SURFACE 0.0001
#define DEBUG_SDF false

out vec4 FragColor;  // gl style...
uniform ivec2 resolution;
uniform float u_time; 

// geometry
vec2 sphere(vec3 v, vec3 p, float r, int mat_id);
vec2 cube(vec3 v, vec3 p, vec3 size, int mat_id);
vec2 rounded_cube(vec3 v, vec3 p, vec3 size, float r, int mat_id);
vec2 torus(vec3, vec3, vec2, int);
vec2 cone(vec3, vec3, vec2, float, int);
vec2 capped_cylinder(vec3, vec3, float, float, int);
vec2 pyramid(vec3, vec3, float, float, int);
vec2 round_operation(vec2, float);

// light
const float daylight_ambient = 0.8;
const float nightlight_ambient = 0.1;
vec3 ambient_light(vec3, vec3, float);
vec3 diffusion_light(vec3, vec3, vec3, vec3, float, float);
vec3 specular_light(vec3, vec3, vec3, vec3, float, float);

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
vec3 twist(vec3, float);
vec3 bend(vec3, float);
vec3 symmetric_y(vec3, vec2);

// color
#define SKY normalize_rgb(vec3(199, 235, 237))
#define GROUND normalize_rgb(vec3(182, 128, 115))
#define GRASS normalize_rgb(vec3(193, 222, 129))
#define BENCH1 normalize_rgb(vec3(150, 135, 65))
#define WATER normalize_rgb(vec3(96, 202, 211))

// material ID
#define GROUND_MATERIAL 0
#define GRASS_MATERIAL  1
#define TRUNK_MATERIAL  2
#define LAMP_MATERIAL   3
#define LAMP_BLUB       4
#define LAMP_MATERIAL2  5
#define BENCH_MATERIAL  6
#define BENCH_SURFACE_MATERIAL 7
#define WATER_MATERIAL  8
#define BRIDGE_MATERIAL 9

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
    vec3 spec_color;
    float k_d;
    float k_s;
    float shininess;
    bool is_lightsource;
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
#define MATERIAL_CNT    10
Material materials[MATERIAL_CNT] = Material[MATERIAL_CNT](
    // ground id 0
    Material(
        GROUND,
        GROUND,
        GROUND,
        0.8,
        0.3,
        3,
        false),
    // grass id 1
    Material(
        GRASS,
        GRASS,
        GRASS,
        0.9,
        0.3,
        3,
        false),
    Material(
        normalize_rgb(vec3(250, 192, 81)),
        normalize_rgb(vec3(250, 192, 81)),
        normalize_rgb(vec3(250, 192, 81)),
        0.9,
        0.3,
        32,
        false),
    Material(
        normalize_rgb(vec3(132, 126, 118)),
        normalize_rgb(vec3(132, 126, 118)),
        normalize_rgb(vec3(132, 126, 118)),
        0.9,
        0.5,
        16,
        false),
    Material(
        normalize_rgb(vec3(250, 250, 250)),
        normalize_rgb(vec3(250, 250, 250)),
        normalize_rgb(vec3(250, 250, 250)),
        0.9,
        0.3,
        3,
        true),
    Material(
        normalize_rgb(vec3(132, 126, 118)),
        normalize_rgb(vec3(132, 126, 118)),
        normalize_rgb(vec3(132, 126, 118)),
        0.9 ,
        0.5,
        16,
        false),
    Material(
        BENCH1,
        BENCH1,
        BENCH1,
        0.9,
        0.3,
        3,
        false),
    Material(
        normalize_rgb(vec3(250, 192, 81)),
        normalize_rgb(vec3(250, 192, 81)),
        normalize_rgb(vec3(250, 192, 81)),
        0.9,
        0.3,
        32,
        false),
    Material(
        WATER,
        WATER,
        WATER,
        0.3,
        3,
        16,
        false
    ),
    Material(
        normalize_rgb(vec3(250, 192, 81)),
        normalize_rgb(vec3(250, 192, 81)),
        normalize_rgb(vec3(250, 192, 81)),
        0.9,
        0.3,
        32,
        false)
);

#define LIGHT_CNT    3
LightSource light_sources[LIGHT_CNT] = LightSource[LIGHT_CNT](
    LightSource(
        vec3(5, 6, 5),
        vec3(1, 1, 1),
        30),
    LightSource(
        vec3(-1, 0.11 + 0.529, 0),
        vec3(0.9191, 0.8109, 0.0659),
        5),
    LightSource(
        vec3(1, 0.11 + 0.529, 0),
        vec3(0.9191, 0.8109, 0.0659),
        5
    )
);

vec2 grass_block(vec3 v, vec3 p, float extent, float height) {
    // p is the center of the bottom.
    vec2 block = union_sdf(
        cube(v, vec3(p.x, p.y + height / 2, p.z), vec3(extent, height, extent), 0),
        cube(v, vec3(p.x, p.y + height + 0.01 / 2, p.z), vec3(extent, 0.01, extent), 1));
    return block;
}

vec2 tree_block(vec3 v, vec3 p, float height, vec2 hit_data) {
    float n1 = 0.25;
    vec2 hit_test = cube(v, vec3(p.x, p.y + (height + n1) / 2, p.z), vec3(n1/2+(n1+0.03)/2+2*(height / 3 + 0.03), height+n1, n1/2+(n1+0.03)/2+2*( p.z - height / 3 - 0.08)), 0);
    if(hit_test.x > hit_data.x) return hit_data;
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
    // float n1 = 0.25;
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

// light source position = p.y + 0.529
vec2 streetlamp_block(vec3 v, vec3 p, vec2 hit_data, bool trace_shadow) {
    vec2 hit_test = cube(v, vec3(p.x, p.y + (0.002 + 0.001 + 0.5 + 0.002 + 0.05 + 0.002 + 0.05) / 2, p.z), vec3(0.09, 0.002 + 0.001 + 0.5 + 0.002 + 0.05 + 0.002 + 0.05, 0.09), 0);
    if(hit_test.x > hit_data.x) return hit_data;

    vec2 base = cube(v, vec3(p.x, p.y + 0.001, p.z), vec3(0.06, 0.002, 0.06), LAMP_MATERIAL);
    base = union_sdf(
        base,
        cube(v, vec3(p.x, p.y+0.002+0.015, p.z), vec3(0.03, 0.12, 0.03), LAMP_MATERIAL)
    );
    base = union_sdf(
        base,
        cube(v, vec3(p.x, p.y+0.002+0.001+0.5, p.z), vec3(0.01, 0.002, 0.01), LAMP_MATERIAL)
    );
    vec2 cylinder = capped_cylinder(v, vec3(p.x, p.y+0.002+0.25, p.z), 0.006, 0.5, LAMP_MATERIAL);

    if(!trace_shadow) vec2 light_block = cube(v, vec3(p.x, p.y+0.002+0.5+0.002+0.025, p.z), vec3(0.05, 0.05, 0.05), LAMP_BLUB);
    vec2 pillar = cube(
        symmetric_y(v, p.xz), 
        vec3(0.027, p.y+0.002+0.5+0.002+0.025, 0.027), 
        vec3(0.004, 0.05, 0.004), LAMP_MATERIAL);
    base = union_sdf(base, pillar);
    if (!trace_shadow) {
        vec2 light_block = cube(v, vec3(p.x, p.y + 0.002 + 0.5 + 0.002 + 0.025, p.z), vec3(0.05, 0.05, 0.05), LAMP_BLUB);
        base = union_sdf(base, light_block);
    }
    base = union_sdf(
        base,
        cube(v, vec3(p.x, p.y+0.002+0.001+0.5+0.002+0.05+0.001, p.z), vec3(0.09, 0.002, 0.09), LAMP_MATERIAL)
    );
    base = union_sdf(
        base,
        pyramid(v, vec3(p.x, p.y+0.002+0.001+0.5+0.002+0.05+0.002, p.z), 0.05, 0.045, LAMP_MATERIAL)
    );
    vec2 lamp = union_sdf(base, cylinder);
    return lamp;
}

/*
    vec3 p is the center of the bottom.
    The const data could be changed to create defferent sizes of benches. 
*/
vec2 bench_block(vec3 v, vec3 p, vec2 hit_data) {
    const float length = 0.3;
    const float height = 0.06;
    const float bottom_length = 0.2;
    const float unit_width = 0.02;
    const float stick_width = 0.02;
    const float gap = 0.005;

    vec2 hit_test = cube(v, vec3(p.x, p.y + height / 2, 0), vec3(length, height, stick_width * 4 + 3 * gap), 0);
    if(hit_test.x > hit_data.x) {
        return hit_data;
    }

    vec2 bench = cube(
        v, vec3(p.x, p.y + height - stick_width / 2, 
        p.z - 1.5 * (gap + unit_width)), 
        vec3(length, stick_width, unit_width), 
        BENCH_SURFACE_MATERIAL
    );

    bench = union_sdf(
        bench,
        cube(
            v, vec3(p.x, p.y + height - stick_width / 2, 
            p.z - 0.5 * (gap + unit_width)), 
            vec3(length, stick_width, unit_width), 
            BENCH_SURFACE_MATERIAL)
    );
    bench = union_sdf(
        bench,
        cube(
            v, vec3(p.x, p.y + height - stick_width / 2, 
            p.z + 0.5 * (gap + unit_width)), 
            vec3(length, stick_width, unit_width), 
            BENCH_SURFACE_MATERIAL)
    );
    bench = union_sdf(
        bench,
        cube(
            v, vec3(p.x, p.y + height - stick_width / 2, 
            p.z + 1.5 * (gap + unit_width)), 
            vec3(length, stick_width, unit_width), 
            BENCH_SURFACE_MATERIAL)
    );
    
    bench = union_sdf(
        bench,
        cube(
            v, vec3(p.x - 0.5 * (bottom_length - unit_width), p.y + (height - stick_width) / 2, p.z), 
            vec3(unit_width, height - stick_width, 4 * unit_width + 3 * gap), 
            BENCH_MATERIAL)
    );
    bench = union_sdf(
        bench,
        cube(
            v, vec3(p.x + 0.5 * (bottom_length - unit_width), p.y + (height - stick_width) / 2, p.z), 
            vec3(unit_width, height - stick_width, 4 * unit_width + 3 * gap), 
            BENCH_MATERIAL)
    );

    return bench;
}

vec2 bridge_block(vec3 v, vec3 p) {
    // p is the center of block.
    const float length = 1.0;
    const float width = 0.35;
    const float height = 0.08;
    const float road_height = 0.02;
    const float road_width = 0.3;
    const float hole_width = 0.6;
    const float hole_height = 0.03;

    vec2 hole = union_sdf(
        cube(v, vec3(p.x, p.y + 0.5 * (height - road_height), p.z), vec3(length, road_height, road_width), BRIDGE_MATERIAL),
        cube(v, vec3(p.x, p.y - 0.5 * (height - hole_height), p.z), vec3(hole_width, hole_height, width), BRIDGE_MATERIAL)
    );
    vec2 bridge = substraction_sdf(hole, cube(v, p, vec3(length, height, width), BRIDGE_MATERIAL));

    return bridge;
}

vec2 hill1(vec3 v, vec2 hit_data) {
    vec2 hit_test = cube(v, vec3(-1.5 + 0.45, 0.11 + 0.405 / 2, 1.5 - 1.2 / 2), vec3(0.9, 0.405, 1.2), 0);
    if(hit_test.x > hit_data.x) return hit_data;
    vec2 res = hit_data;
    for (int i = 0; i < 3; ++i) {
        for (int j = 0; j < 3 - i + 1; ++j) {
            int h = (3 - i + 1 - j);
            if (h == 4) h = 3;
            res = union_sdf(
                res,
                grass_block(v, vec3(-1.5 + (2 * i + 1) * 0.15, 0.1, 1.5 - (2 * j + 1) * 0.15), 0.3, h * 0.125));
        }
    }
    return res;
}

vec2 hill2(vec3 v, vec2 hit_data) {
    vec2 hit_test = cube(v, vec3(1, 0.1 + 0.16, 1), vec3(1, 0.32, 1), 0);
    if(hit_test.x > hit_data.x) return hit_data;
    vec2 res = hit_data;
    res = union_sdf(
        res,
        grass_block(v, vec3(1, 0.1, 1), 1, 0.15));
    res = union_sdf(
        res,
        grass_block(v, vec3(1.25, 0.25, 1.25), 0.5, 0.15));
    return res;
}

/**
 * scene sdf, construct the scene here with geometric primitives
 *
 * @param[in] vector  Ray vector
 *
 * @return Distance from the ray to the scene
 */
vec2 scene(vec4 iv) {
    float land_adjust = 0.04;

    vec3 v = iv.xyz;
    bool trace_shadow = iv.w == 1;

    vec2 ground = grass_block(v, vec3(0, -0.2 - land_adjust, 0), 3, 0.3 + land_adjust);

    vec2 riverbed = cube(v, vec3(0, -0.1 + 0.12, 0), vec3(1, 0.2 + land_adjust * 2, 5), 0);
    vec2 river = cube(v, vec3(0, -0.05 - land_adjust, 0), vec3(1, 0.2, 3), WATER_MATERIAL);
    ground = substraction_sdf(riverbed, ground);
    ground = union_sdf(ground, river);
    vec2 res = ground;

    res = union_sdf(
        res,
        tree_block(v, vec3(-1.5 + 0.15, 0.375+0.1, 1.5 - 0.15), 0.5, res)
    );

    res = union_sdf(
        res,
        tree_block(v, vec3(1, 0.11+0.15, 0.65), 0.3, res)
    );

    res = union_sdf(
        res,
        streetlamp_block(v, vec3(-1, 0.1+0.01, 0), res, trace_shadow)
    );

    res = union_sdf(
        res,
        streetlamp_block(v, vec3(1, 0.1 + 0.01, 0), res, trace_shadow)
    );

    res = union_sdf(
        res,
        bench_block(v, vec3(-0.7, 0.1, 0), res)
    );

    res = union_sdf(
        res,
        bridge_block(v, vec3(0, 0.09 - land_adjust, -0.4))
    );

    res = hill1(v, res);
    res = hill2(v, res);

    return vec2(res.x, res.y);
}

/**
 * Normal of a given point in the scene
 * 
 * @param[in] Point  The point to compute the normal for
 */
vec3 normal(vec3 p) {
    const float eps = 0.00001;
    return normalize(vec3(
        scene(vec4(p.x + eps, p.y, p.z, 0)).x - scene(vec4(p.x - eps, p.y, p.z, 0)).x,
        scene(vec4(p.x, p.y + eps, p.z, 0)).x - scene(vec4(p.x, p.y - eps, p.z, 0)).x,
        scene(vec4(p.x, p.y, p.z + eps, 0)).x - scene(vec4(p.x, p.y, p.z - eps, 0)).x));
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
        res = scene(vec4(p, 0));
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

// Sebastian Aaltonen's soft shadow improvement
float soft_shadow(in vec3 ro, in vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float ph = 1e20;
    float h = 0;
    Material mat;
    for (float t = mint; t < maxt;) {
        vec2 hit = scene(vec4(ro + rd * t, 1));
        h = hit.x;
        mat = materials[int(hit.y)];
        if (h < 0.001)
            break;
        float h2 = pow(h, 2);
        float y = h2/ (2.0 * ph);
        float d = sqrt(h2 - y * y);
        res = min(res, k * d / max(0.0, t - y));
        ph = h;
        t += h;
    }
    if(h < 0.001 && !mat.is_lightsource) return 0;
    return res;
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
    vec2 resolution_ = resolution;
    vec2 ratio = vec2(resolution_.x / resolution_.y, 1.0);
    vec2 uv = ratio * (gl_FragCoord.xy / resolution_.xy - 0.5);
    vec3 ro = vec3(3 * cos(u_time), 2, 3 * sin(u_time));
    // vec3 ro = vec3(3, 3, -3);
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
        
        for (int i = 0; i < LIGHT_CNT; ++i) {
            LightSource ls = light_sources[i];
            float light_dist = length(ls.light_pos - p);
            float attenuation = 1.0 / (1.0 + 0.7 * light_dist + 1.80 * light_dist * light_dist);

            // LightSource ls = light_sources[i];
            // find shadow
            vec3 n = normal(p);
            vec3 light_dir = normalize(ls.light_pos - p);

            // vec2 shadow_res = ray_march(p + n * 0.001, light_dir);
            // // without the n * eps, the ray will be blocked by the surface
            // vec2 light_res = ray_march(ls.light_pos, -light_dir);
            // float shadow_dist = shadow_res.x;
            // if (shadow_res.x + 2 * abs(light_res.x)< length(ls.light_pos - p)) {
            //     dif_color *= 0.3;
            // }

            vec2 light_res = ray_march(ls.light_pos, -light_dir);
            vec3 light_surface = ls.light_pos - light_dir * light_res.x;
            float shadow = soft_shadow(p + n * 0.001, light_dir, SURFACE, length(ls.light_pos - p), 8);

            dif_color += diffusion_light(
                p, ls.light_pos,
                ls.light_color, hit_material.diffuse_color,
                hit_material.k_d, ls.intensity) * attenuation * shadow ;
            dif_color += specular_light(
                p, normalize(ls.light_pos - p),
                ls.light_color, hit_material.spec_color, hit_material.k_s, hit_material.shininess) * shadow;
        }

        dif_color += ambient_light(hit_material.ambient_color, vec3(1, 1, 1), daylight_ambient);
        if(hit_material.is_lightsource) {
            dif_color = hit_material.diffuse_color;
        }
        if (DEBUG_SDF) {
            FragColor = vec4(vec3(dist / 5.0), 1.0);
        } else {
            FragColor = vec4(dif_color, 1.0);
        }
    }
}
