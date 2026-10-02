import { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';

const fields = [
  ['tagline', 'Tagline'],
  ['about', 'About'],
  ['dept', 'Department'],
  ['year', 'Year'],
  ['interests', 'Interests'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
];

export default function Profile() {
  const [edit, setEdit] = useState(false);
  const [dp, setDp] = useState(null);
  const [data, setData] = useState({
    name: 'Jitendra Mahant',
    tagline: 'Computer Engineering Student • K. K. Wagh Institute',
    about: 'Computer Engineering student passionate about web development and building impactful platforms.',
    dept: 'Computer Engineering',
    year: 'Third Year',
    interests: 'Backend, APIs, Web Development',
    linkedin: 'https://linkedin.com/in/jitendramahant',
    github: 'https://github.com/jitendramahant',
  });

  const change = (e) => setData({ ...data, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
        <button onClick={() => setEdit(!edit)} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">
          {edit ? 'Save' : 'Edit Profile'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          
          {/* Profile Picture & Controls */}
          <div className="relative">
            {dp ? (
              <img src={dp} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-800 text-xl font-bold text-white">
                {data.name.split(' ').map((w) => w[0]).join('')}
              </div>
            )}
            
            {edit && (
              <div className="absolute -bottom-2 -right-3 flex gap-1">
                <label className="cursor-pointer rounded-full bg-white p-1.5 shadow border border-slate-200 text-slate-700 hover:bg-slate-50" title="Change Photo">
                  <Camera size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setDp(URL.createObjectURL(e.target.files[0]))} />
                </label>
                {dp && (
                  <button onClick={() => setDp(null)} className="rounded-full bg-white p-1.5 shadow border border-slate-200 text-red-600 hover:bg-red-50" title="Remove Photo">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            {edit ? (
              <input name="name" value={data.name} onChange={change} className="w-full rounded-lg border border-slate-300 p-1.5 text-xl font-bold text-slate-900" />
            ) : (
              <h2 className="text-xl font-bold text-slate-900">{data.name}</h2>
            )}
            <p className="text-sm text-slate-500">{data.tagline}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {fields.map(([key, label]) => (
            <div key={key} className={key === 'about' || key === 'tagline' ? 'md:col-span-2' : ''}>
              <p className="text-sm font-bold text-slate-900">{label}</p>
              {edit ? (
                <input name={key} value={data[key]} onChange={change} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" />
              ) : key === 'linkedin' || key === 'github' ? (
                <a href={data[key]} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-medium text-blue-600 hover:underline truncate">
                  {data[key]}
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{data[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}