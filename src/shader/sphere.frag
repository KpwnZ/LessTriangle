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
        mat_id
	);
}
