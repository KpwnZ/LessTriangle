#version 330 core

/**
 * SDF of sphere
 *
 * @param[in] vector    Input vector
 * @param[in] position  Position of the vertex
 * @param[in] radius    Radius of the sphere
 *
 * @return Distance from the vertex to the sphere
 */
vec4 sphere(vec3 v, vec3 p, float r, vec3 color) {
    return vec4(
        length(v - p) - r,
        color
	);
}
