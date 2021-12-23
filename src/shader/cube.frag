#version 330 core

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
vec4 cube(vec3 v, vec3 p, vec3 size, vec3 color) {
    vec3 d = abs(v - p) - size;     // size = (l, w, h), 
                                    // d.axis < 0 means the corresponding 
                                    // point is inside the box
    d.x = max(d.x, 0);
    d.y = max(d.y, 0);
    d.z = max(d.z, 0);
    float di = min(max(d.x, max(d.y, d.z)), 0.0) + length(d);   
    // notice that we use abs() before
    // then length(d) will return the distance to the surface of cube
    // if the point is outside the box.
    // min(max(d.x, max(d.y, d.z)), 0.0) will return 0
    // if the point is inside the box
    return vec4(di, color);
}