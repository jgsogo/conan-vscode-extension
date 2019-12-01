
#pragma once
<% if (!is_library) { %>
#include <iostream>
<% } %>
namespace <%= name %> {

    void hello()<% if (is_library) { %>;<% } else { %> {
        std::cout << "Hello <%= name %>\n";
    }<% } %>

}
