// Hash-map inverted index: skill -> set of alumni ids. O(1) average lookup.
// JS counterpart used by the API: backend/dsa/SkillIndex.js
//
// Build:  g++ -std=c++11 -O2 -o ../bin/skill_hashmap skill_hashmap.cpp
// Run:    ../bin/skill_hashmap
#include <algorithm>
#include <cassert>
#include <cctype>
#include <iostream>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>

class SkillIndex {
    std::unordered_map<std::string, std::set<int> > index;

    static std::string key(const std::string& s) {
        std::string out;
        for (size_t i = 0; i < s.size(); ++i) out += static_cast<char>(std::tolower(static_cast<unsigned char>(s[i])));
        return out;
    }

public:
    void add(const std::string& skill, int alumniId) { index[key(skill)].insert(alumniId); }

    std::vector<int> lookup(const std::string& skill) const {
        std::unordered_map<std::string, std::set<int> >::const_iterator it = index.find(key(skill));
        if (it == index.end()) return std::vector<int>();
        return std::vector<int>(it->second.begin(), it->second.end());
    }

    // Alumni who have ALL the given skills (set intersection).
    std::vector<int> lookupAll(const std::vector<std::string>& skills) const {
        std::vector<int> result;
        for (size_t i = 0; i < skills.size(); ++i) {
            std::vector<int> ids = lookup(skills[i]);
            if (i == 0) { result = ids; continue; }
            std::vector<int> merged;
            std::set_intersection(result.begin(), result.end(), ids.begin(), ids.end(), std::back_inserter(merged));
            result.swap(merged);
        }
        return result;
    }

    size_t skillCount() const { return index.size(); }
};

int main() {
    SkillIndex idx;
    // alumni id -> skills (demo data)
    idx.add("React", 1);  idx.add("Node.js", 1); idx.add("MongoDB", 1);
    idx.add("React", 2);  idx.add("TypeScript", 2);
    idx.add("Python", 3); idx.add("Machine Learning", 3);
    idx.add("react", 4);  idx.add("Node.js", 4);

    std::vector<int> react = idx.lookup("REACT");
    assert(react.size() == 3);
    std::vector<std::string> both;
    both.push_back("React");
    both.push_back("Node.js");
    assert(idx.lookupAll(both).size() == 2);
    assert(idx.lookup("Cobol").empty());

    std::cout << "Alumni with React:";
    for (size_t i = 0; i < react.size(); ++i) std::cout << " #" << react[i];
    std::cout << "\nDistinct skills indexed: " << idx.skillCount() << "\nSkill index self-test passed.\n";
    return 0;
}
