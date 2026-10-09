/**
 * Trie (prefix tree) used for alumni/skill autocomplete.
 * Each terminal node stores the canonical display strings that end there.
 * Mirrors cpp/search/trie.cpp.
 */
class TrieNode {
  constructor() {
    this.children = new Map();
    this.words = new Map(); // normalized word -> { label, count }
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.size = 0;
  }

  static normalize(s) {
    return String(s).trim().toLowerCase();
  }

  // Insert a label; repeated inserts increment its frequency.
  insert(label) {
    const word = Trie.normalize(label);
    if (!word) return;
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
    }
    const existing = node.words.get(word);
    if (existing) existing.count += 1;
    else {
      node.words.set(word, { label: String(label).trim(), count: 1 });
      this.size += 1;
    }
  }

  // Returns up to `limit` labels starting with `prefix`, most frequent first.
  autocomplete(prefix, limit = 8) {
    const p = Trie.normalize(prefix);
    let node = this.root;
    for (const ch of p) {
      node = node.children.get(ch);
      if (!node) return [];
    }
    const results = [];
    const stack = [node];
    while (stack.length) {
      const cur = stack.pop();
      for (const entry of cur.words.values()) results.push(entry);
      for (const child of cur.children.values()) stack.push(child);
    }
    return results
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, limit)
      .map((r) => ({ label: r.label, count: r.count }));
  }

  has(label) {
    const word = Trie.normalize(label);
    let node = this.root;
    for (const ch of word) {
      node = node.children.get(ch);
      if (!node) return false;
    }
    return node.words.has(word);
  }
}

module.exports = Trie;
