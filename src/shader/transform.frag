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
