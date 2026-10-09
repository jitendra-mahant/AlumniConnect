/**
 * Hash-map inverted index: normalized skill -> Set of alumni profile ids.
 * Gives O(1) average lookup of "who knows React?". Mirrors cpp/search/skill_hashmap.cpp.
 */
class SkillIndex {
  constructor() {
    this.map = new Map();
  }

  static key(skill) {
    return String(skill).trim().toLowerCase();
  }

  add(skill, id) {
    const k = SkillIndex.key(skill);
    if (!k) return;
    if (!this.map.has(k)) this.map.set(k, new Set());
    this.map.get(k).add(String(id));
  }

  lookup(skill) {
    const set = this.map.get(SkillIndex.key(skill));
    return set ? Array.from(set) : [];
  }

  has(skill) {
    return this.map.has(SkillIndex.key(skill));
  }

  // Skills ranked by how many alumni have them.
  topSkills(limit = 15) {
    return Array.from(this.map.entries())
      .map(([skill, ids]) => ({ skill, count: ids.size }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
      .slice(0, limit);
  }
}

module.exports = SkillIndex;
