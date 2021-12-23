#include <GL/glew.h>
#include <GLFW/glfw3.h>

#include <cmath>
#include <filesystem>
#include <fstream>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <iostream>
#include <iterator>
#include <vector>

/**
 * Read shader source file to std::string.
 * 
 * @param[in] path. The path of the shader source code file.
 * 
 * @return The shader source code.
 */
static std::string read_shader(const std::filesystem::path::value_type *path) {
    std::ifstream ifs;
    ifs.exceptions(ifs.exceptions() | std::ios_base::badbit | std::ios_base::failbit);
    ifs.open(path);
    ifs.ignore(std::numeric_limits<std::streamsize>::max());

    ifs.clear();
    ifs.seekg(0, std::ios_base::beg);

    return std::string({std::istreambuf_iterator<char>{ifs}, {}});
}

int main(int argc, char **argv, char **envp) {
    int success;
    const int width = 1024;
    const int height = 768;
    int framebufferWidth = 0;
    int framebufferHeight = 0;
    int resolution[] = {width, height};
    if (!glfwInit()) {
        fprintf(stderr, "failed to init\n");
    }

    glfwWindowHint(GLFW_SAMPLES, 4);

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);

    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    GLFWwindow *window;
    window = glfwCreateWindow(width, height, "LessTriangle", NULL, NULL);

    glfwGetFramebufferSize(window, &resolution[0], &resolution[1]);
    
    if (window == NULL) {
        fprintf(stderr, "failed to create window\n");
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);
    glewExperimental = GL_TRUE;

    if (glewInit() != GLEW_OK) {
        fprintf(stderr, "failed to init glew.\n");
        return -1;
    }
    
    glfwSetInputMode(window, GLFW_STICKY_KEYS, GL_TRUE);

    const float vertices[] = {
        1.0f, 1.0f, 0.0f,   // top right
        1.0f, -1.0f, 0.0f,  // bottom right
        -1.0f, 1.0f, 0.0f,  // top left

        -1.0f, -1.0f, 0.0f,  // bottom left
        -1.0f, 1.0f, 0.0f,   // top left
        1.0f, -1.0f, 0.0f,   // bottom right
    };

    // unsigned int fragment_shader = glCreateShader(GL_FRAGMENT_SHADER);
    // std::string frag_shader_str = read_shader("../src/shader/main_frag.frag");

    unsigned int vertex_shader = glCreateShader(GL_VERTEX_SHADER);
    std::string vert_shader_str = read_shader("../src/shader/main_vert.vert");

    // unsigned int sphere_shader = glCreateShader(GL_FRAGMENT_SHADER);
    // std::string shpere_shader_str = read_shader("../src/shader/sphere.frag");

    // unsigned int lighting_shader = glCreateShader(GL_FRAGMENT_SHADER);
    // std::string lighting_shader_str = read_shader("../src/shader/lighting_model.frag");

    const char *vert_shader_src = vert_shader_str.c_str();
    // const char *frag_shader_src = frag_shader_str.c_str();
    // const char *sphere_shader_src = shpere_shader_str.c_str();
    // const char *lighting_shader_src = lighting_shader_str.c_str();

    glShaderSource(vertex_shader, 1, &vert_shader_src, NULL);
    // glShaderSource(fragment_shader, 1, &frag_shader_src, NULL);
    // glShaderSource(sphere_shader, 1, &sphere_shader_src, NULL);
    // glShaderSource(lighting_shader, 1, &lighting_shader_src, NULL);

    glCompileShader(vertex_shader);
    // glCompileShader(fragment_shader);
    // glCompileShader(sphere_shader);
    // glCompileShader(lighting_shader);

    // glGetShaderiv(fragment_shader, GL_COMPILE_STATUS, &success);
    // if (!success) {
    //     char info_log[512];
    //     glGetShaderInfoLog(fragment_shader, 512, NULL, info_log);
    //     fprintf(stderr, "[-] fragment shader compile error: %s\n", info_log);
    // }

    glGetShaderiv(vertex_shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char info_log[512];
        glGetShaderInfoLog(vertex_shader, 512, NULL, info_log);
        fprintf(stderr, "[-] vertex shader compile error: %s\n", info_log);
    }

    // glGetShaderiv(sphere_shader, GL_COMPILE_STATUS, &success);
    // if (!success) {
    //     char info_log[512];
    //     glGetShaderInfoLog(sphere_shader, 512, NULL, info_log);
    //     fprintf(stderr, "[-] sphere shader compile error: %s\n", info_log);
    // }

    // glGetShaderiv(lighting_shader, GL_COMPILE_STATUS, &success);
    // if (!success) {
    //     char info_log[512];
    //     glGetShaderInfoLog(lighting_shader, 512, NULL, info_log);
    //     fprintf(stderr, "[-] lighting shader compile error: %s\n", info_log);
    // }

    unsigned int shader_program = glCreateProgram();
    glAttachShader(shader_program, vertex_shader);
    // glAttachShader(shader_program, sphere_shader);
    // glAttachShader(shader_program, fragment_shader);
    // glAttachShader(shader_program, lighting_shader);

    std::vector<const char *> shaders = {
        "../src/shader/main_frag.frag",
        "../src/shader/sphere.frag",
        "../src/shader/cube.frag",
        "../src/shader/lighting_model.frag"
    };

    for(auto filename : shaders) {
        unsigned int shader = glCreateShader(GL_FRAGMENT_SHADER);
        std::string shader_str = read_shader(filename);
        const char *shader_src = shader_str.c_str();
        glShaderSource(shader, 1, &shader_src, NULL);
        glCompileShader(shader);
        glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
        if (!success) {
            char info_log[512];
            glGetShaderInfoLog(shader, 512, NULL, info_log);
            fprintf(stderr, "[-] %s shader compile error: %s\n", filename, info_log);
        }
        glAttachShader(shader_program, shader);
    }

    glLinkProgram(shader_program);
    glUseProgram(shader_program);

    unsigned int vbo;
    glGenBuffers(1, &vbo);

    unsigned int vao;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void *)0);
    glEnableVertexAttribArray(0);
    // glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
    glUniform2iv(glGetUniformLocation(shader_program, "resolution"), 1, resolution);
    do {
        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        glDrawArrays(GL_TRIANGLES, 0, 6);
        glBindVertexArray(vao);

        glfwSwapBuffers(window);
        glfwPollEvents();
    } while (glfwGetKey(window, GLFW_KEY_ESCAPE) != GLFW_PRESS && glfwWindowShouldClose(window) == 0);

    return 0;
}
