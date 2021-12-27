#version 330 core

vec3 rotate_x(vec3 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
}

vec3 rotate_y(vec3 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(v.x * c + v.z * s, v.y, v.x * -s + v.z * c);
}

vec3 rotate_z(vec3 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
}

// rotate a vector around vector n
vec3 rotate(vec3 v, vec3 n, float angle) {
    mat3 rotate_mat = mat3(
        vec3(n.x * n.x * (1.0 - cos(angle)) + cos(angle), n.x * n.y * (1.0 - cos(angle)) - n.z * sin(angle), n.x * n.z * (1.0 - cos(angle)) + n.y * sin(angle)),
        vec3(n.x * n.y * (1.0 - cos(angle)) + n.z * sin(angle), n.y * n.y * (1.0 - cos(angle)) + cos(angle), n.y * n.z * (1.0 - cos(angle)) - n.x * sin(angle)),
        vec3(n.x * n.z * (1.0 - cos(angle)) - n.y * sin(angle), n.y * n.z * (1.0 - cos(angle)) + n.x * sin(angle), n.z * n.z * (1.0 - cos(angle)) + cos(angle))
    );
    return rotate_mat * v;
}

vec3 twist(vec3 p, float k) {
    float c = cos(k * p.y);
    float s = sin(k * p.y);
    mat2 m = mat2(c, -s, s, c);
    vec2 q = vec2(m * p.xz);
    return vec3(q.x, p.y, q.y);
}

vec3 bend(vec3 p, float k) {
    float c = cos(k * p.x);
    float s = sin(k * p.x);
    mat2 m = mat2(c, -s, s, c);
    return vec3(m * p.xy, p.z);
}

vec3 symmetric_y(vec3 p, vec2 axis) {
    return vec3(abs(p.x - axis.x), p.y, abs(p.z - axis.y));
}