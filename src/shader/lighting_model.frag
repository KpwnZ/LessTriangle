#version 330 core
// lighting model

vec3 normal(vec3 p);

/**
 * Ambient light.
 *
 * @return return the strength of the ambient light.
 */
vec3 ambient_light(vec3 color, vec3 light_color, float k) {
    return color * light_color * k;
}

vec3 diffusion_light(
    vec3 p,
    vec3 light_pos,
    vec3 light_color,
    vec3 diffuse_color,
    float k_d,
    float intensity) 
{
    vec3 nor = normal(p);                       // the normal vector
    vec3 light_dir = normalize(light_pos - p);  // the direction of the light
    float diff = max(dot(nor, light_dir), 0.0);
    vec3 diffuse = diffuse_color * light_color * (diff * k_d) * intensity;
    return diffuse;
}

vec3 specular_light(
    vec3 p,
    vec3 light_dir,
    vec3 light_color,
    vec3 spec_color,
    float shininess) 
{
    vec3 nor = normal(p);  // the normal vector
    vec3 view_dir = normalize(-p);
    vec3 reflect_dir = reflect(-light_dir, nor);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), shininess);
    vec3 specular = spec_color * light_color * spec;
    return specular;
}

