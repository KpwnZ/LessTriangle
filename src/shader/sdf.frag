#version 330 core

vec2 union_sdf(vec2 sdf1, vec2 sdf2) {
    if(sdf1.x <= sdf2.x) {
        return sdf1;
    }
    return sdf2;
}

vec2 intersection_sdf(vec2 sdf1, vec2 sdf2) {
    if (sdf1.x <= sdf2.x) {
        return sdf2;
    }
    return sdf1;
}
