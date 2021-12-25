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
