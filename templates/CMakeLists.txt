cmake_minimum_required(VERSION 3.15)
project(<%= name %> CXX)

# Find requirements
# find_package(requirement REQUIRED)

# Gather sources
<% if (is_library) { %>
file(GLOB SOURCES
        src/<%= name %>.cpp)
<% } %>
file(GLOB HEADERS
        include/<%= name %>/<%= name %>.h)

add_library(<%= name %> ${SOURCES} ${HEADERS})
target_include_directories(
        <%= name %> PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include/>
        $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>)

# Link requirements
# target_link_libraries(<%= name %> PUBLIC requirement::requirement)
