from conans import ConanFile

class <%= _.capitalize(name) %>Recipe(ConanFile):
    name = "<%= name %>"

    def package_info(self):
        self.cpp_info.header_only()
