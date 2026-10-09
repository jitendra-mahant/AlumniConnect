// Trie (prefix tree) for alumni / skill autocomplete.
// JS counterpart used by the API: backend/dsa/Trie.js
//
// Build:  g++ -std=c++11 -O2 -o ../bin/trie trie.cpp
// Run:    ../bin/trie            (demo + self-test)
//         ../bin/trie rea        (autocomplete for a prefix)
#include <algorithm>
#include <cassert>
#include <cctype>
#include <iostream>
#include <map>
#include <string>
#include <vector>

class Trie {
    struct Node {
        std::map<char, Node*> next;
        bool terminal;
        int count;           // how many times the word was inserted (popularity)
        std::string label;   // original casing for display
        Node() : terminal(false), count(0) {}
    };
    Node* root;

    static std::string normalize(const std::string& s) {
        std::string out;
        for (size_t i = 0; i < s.size(); ++i) out += static_cast<char>(std::tolower(static_cast<unsigned char>(s[i])));
        return out;
    }

    void destroy(Node* n) {
        for (std::map<char, Node*>::iterator it = n->next.begin(); it != n->next.end(); ++it) destroy(it->second);
        delete n;
    }

    void collect(Node* n, std::vector<std::pair<int, std::string> >& out) const {
        if (n->terminal) out.push_back(std::make_pair(n->count, n->label));
        for (std::map<char, Node*>::const_iterator it = n->next.begin(); it != n->next.end(); ++it) collect(it->second, out);
    }

public:
    Trie() : root(new Node()) {}
    ~Trie() { destroy(root); }

    // O(L) insert, L = word length
    void insert(const std::string& label) {
        Node* cur = root;
        const std::string w = normalize(label);
        for (size_t i = 0; i < w.size(); ++i) {
            Node*& child = cur->next[w[i]];
            if (!child) child = new Node();
            cur = child;
        }
        if (!cur->terminal) { cur->terminal = true; cur->label = label; }
        cur->count++;
    }

    bool contains(const std::string& label) const {
        const Node* cur = root;
        const std::string w = normalize(label);
        for (size_t i = 0; i < w.size(); ++i) {
            std::map<char, Node*>::const_iterator it = cur->next.find(w[i]);
            if (it == cur->next.end()) return false;
            cur = it->second;
        }
        return cur->terminal;
    }

    // Up to `limit` completions, most popular first.
    std::vector<std::string> autocomplete(const std::string& prefix, size_t limit = 8) const {
        const Node* cur = root;
        const std::string p = normalize(prefix);
        for (size_t i = 0; i < p.size(); ++i) {
            std::map<char, Node*>::const_iterator it = cur->next.find(p[i]);
            if (it == cur->next.end()) return std::vector<std::string>();
            cur = it->second;
        }
        std::vector<std::pair<int, std::string> > found;
        collect(const_cast<Node*>(cur), found);
        std::sort(found.begin(), found.end(), [](const std::pair<int, std::string>& a, const std::pair<int, std::string>& b) {
            return a.first != b.first ? a.first > b.first : a.second < b.second;
        });
        std::vector<std::string> out;
        for (size_t i = 0; i < found.size() && i < limit; ++i) out.push_back(found[i].second);
        return out;
    }
};

int main(int argc, char** argv) {
    Trie trie;
    const char* terms[] = {"React", "React", "React Native", "Redux", "Python", "PyTorch", "Pandas", "Node.js", "MongoDB",
                           "Machine Learning", "Microsoft", "Google", "TCS", "Software Engineering", "Data Science"};
    for (size_t i = 0; i < sizeof(terms) / sizeof(terms[0]); ++i) trie.insert(terms[i]);

    // self-test
    assert(trie.contains("react"));
    assert(!trie.contains("rea"));
    std::vector<std::string> r = trie.autocomplete("re");
    assert(!r.empty() && r[0] == "React");  // inserted twice -> most popular
    assert(trie.autocomplete("zzz").empty());

    const std::string prefix = argc > 1 ? argv[1] : "re";
    std::cout << "Autocomplete for \"" << prefix << "\":\n";
    std::vector<std::string> res = trie.autocomplete(prefix);
    for (size_t i = 0; i < res.size(); ++i) std::cout << "  - " << res[i] << "\n";
    std::cout << "Trie self-test passed.\n";
    return 0;
}
