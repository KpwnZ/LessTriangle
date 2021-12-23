#version 330 core

vec4 union_sdf(vec4 sdf1, vec4 sdf2) {
    if(sdf1.x <= sdf2.x) {
        return sdf1;
    }
    return sdf2;
}
