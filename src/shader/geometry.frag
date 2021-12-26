#version 330 core

/**
 * SDF of sphere
 *
 * @param[in] vector        Input vector
 * @param[in] position      Position of the vertex
 * @param[in] radius        Radius of the sphere
 * @param[in] material ID   Material of the sphere
 *
 * @return Distance from the vertex to the sphere
 */
vec2 sphere(vec3 v, vec3 p, float r, int mat_id) {
    return vec2(
        length(v - p) - r,
        mat_id);
}

/**
 * SDF of cube
 * 
 * @param[in] vector    Input vector
 * @param[in] position  Position of the cube
 * @param[in] size      Size of the cube, (x, y, z)
 * @param[in] color     Color of the cube
 * 
 * @return Distance to the cube
 */
vec2 cube(vec3 v, vec3 p, vec3 size, int mat_id) {
    vec3 d = abs(v - p) - (size / 2);  // size = (l, w, h),
                                       // d.axis < 0 means the corresponding
                                       // point is inside the box
    vec3 dd = d;
    dd.x = max(d.x, 0);
    dd.y = max(d.y, 0);
    dd.z = max(d.z, 0);
    float di = min(max(d.x, max(d.y, d.z)), 0.0) + length(dd);
    // notice that we use abs() before
    // then length(d) will return the distance to the surface of cube
    // if the point is outside the box.
    // min(max(d.x, max(d.y, d.z)), 0.0) will return 0
    // if the point is inside the box
    return vec2(di, mat_id);
}

vec2 rounded_cube(vec3 v, vec3 p, vec3 size, float r, int mat_id) {
    vec3 d = abs(v - p) - (size / 2);  // size = (l, w, h),
                                       // d.axis < 0 means the corresponding
                                       // point is inside the box
    d.x = max(d.x, 0);
    d.y = max(d.y, 0);
    d.z = max(d.z, 0);
    float di = min(max(d.x, max(d.y, d.z)), 0.0) + length(d) - r;
    // notice that we use abs() before
    // then length(d) will return the distance to the surface of cube
    // if the point is outside the box.
    // min(max(d.x, max(d.y, d.z)), 0.0) will return 0
    // if the point is inside the box
    return vec2(di, mat_id);
}

vec2 torus(vec3 v, vec3 o, vec2 t, int mat_id) {
    // t are the radii
    vec3 p = v - o;
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return vec2(length(q) - t.y, mat_id);
}

vec2 cone(vec3 v, vec3 o, vec2 c, float h, int mat_id) {
    // c is the sin/cos of the angle, h is height
    // Alternatively pass q instead of (c,h),
    // which is the point at the base in 2D
    vec3 p = v - o;
    vec2 q = h * vec2(c.x / c.y, -1.0);
    
    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
    vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
    return vec2(sqrt(d) * sign(s), mat_id);
}


vec2 capped_cylinder(vec3 v, vec3 o, float r, float h, int mat_id) {
    vec3 p = v - o;
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h, r);
    return vec2(min(max(d.x, d.y), 0.0) + length(max(d, 0.0)), mat_id);
}

vec2 pyramid(vec3 v, vec3 p, float h, int mat_id) {
    float m2 = h * h + 0.25;

    p = p - v;
    p.xz = abs(p.xz);
    p.xz = (p.z > p.x) ? p.zx : p.xz;
    p.xz -= 0.5;

    vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);

    float s = max(-q.x, 0.0);
    float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);

    float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
    float b = m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);

    float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);

    return vec2(sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y)), mat_id);
}
