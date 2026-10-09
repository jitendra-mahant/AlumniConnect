const AlumniProfile = require('../models/AlumniProfile');
const Trie = require('./Trie');
const SkillIndex = require('./SkillIndex');

/**
 * In-memory search indexes built from MongoDB (the source of truth).
 * Rebuilt lazily whenever alumni data changes (profile saved / verified).
 */
let state = { trie: new Trie(), skills: new SkillIndex(), built: false, building: null };

async function rebuild() {
  const profiles = await AlumniProfile.find({ verificationStatus: 'verified' })
    .select('skills technologies currentCompany currentJobTitle professionalDomain industry')
    .lean();

  const trie = new Trie();
  const skills = new SkillIndex();
  for (const p of profiles) {
    const id = p._id;
    [...(p.skills || []), ...(p.technologies || [])].forEach((s) => {
      skills.add(s, id);
      trie.insert(s);
    });
    [p.currentCompany, p.currentJobTitle, p.professionalDomain, p.industry].forEach((v) => v && trie.insert(v));
  }
  state = { trie, skills, built: true, builtAt: Date.now(), building: null };
}

async function ensureIndex() {
  if (state.built && Date.now() - (state.builtAt || 0) < 15000) return state;
  if (!state.building) state.building = rebuild();
  await state.building;
  return state;
}

// Mark the index stale; the next search rebuilds it.
function invalidate() {
  state = { ...state, built: false, building: null };
}

module.exports = { ensureIndex, invalidate };
