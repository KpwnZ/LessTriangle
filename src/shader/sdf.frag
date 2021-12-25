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

vec2 substraction_sdf(vec2 sdf1, vec2 sdf2) {
    // Substract sdf1 from sdf2.
    return vec2(max(-sdf1.x, sdf2.x), sdf2.y);
}

vec2 smooth_union_sdf(vec2 sdf1, vec2 sdf2, float k) {
    float h = clamp(0.5 + 0.5 * (sdf2.x - sdf1.x) / k, 0.0, 1.0);
    return vec2(mix(sdf2.x, sdf1.x, h) - k * h * (1.0 - h), sdf1.y); 
}

vec2 smooth_intersection_sdf(vec2 sdf1, vec2 sdf2, float k) {
    float h = clamp(0.5 - 0.5 * (sdf2.x - sdf1.x) / k, 0.0, 1.0);
    return vec2(mix(sdf2.x, sdf1.x, h) + k * h * (1.0 - h), sdf1.y); 
}

vec2 smooth_substraction_sdf(vec2 sdf1, vec2 sdf2, float k) {
    float h = clamp(0.5 - 0.5 * (sdf2.x + sdf1.x) / k, 0.0, 1.0);
    return vec2(mix(sdf2.x, -sdf1.x, h) + k * h * (1.0 - h), sdf1.y); 
}