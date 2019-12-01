from conans import ConanFile, CMakeToolchain


class <%= _.capitalize(name) %>Recipe(ConanFile):
    name = "<%= name %>"
    version = "0.0.1"

    settings = "os", "arch", "compiler", "build_type"
    <% if (is_library) { %>
    options = {"shared": [True, False], "fPIC": [True, False]}
    default_options = {"shared": False, "fPIC": True}
    <% } %>
    scm = {
        "type": "git",
        "url": "auto",
        "revision": "auto"
    }
    <% if (is_library) { %>
    def config_options(self):
        if self.settings.os == "Windows":
            del self.options.fPIC
    <% } %>
    def toolchain(self):
        return CMakeToolchain(self)

    def _cmake_configure(self):
        cmake = CMake(self)
        cmake.configure()
        return cmake

    def build(self):
        cmake = self._cmake_configure()
        cmake.build()

    def package(self):
        cmake = self._cmake_configure()
        cmake.install()
        # Copy other files to the package
        # self.copy("*LICENSE*", src=self.source_folder, dst="licenses", keep_path=False)
    <% if (!is_library) { %>
    def package_id(self):
        self.info.header_only()
    <% } %>
