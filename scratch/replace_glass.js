const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'client/src/pages/AdminDashboard.jsx',
    'client/src/pages/Login.jsx',
    'client/src/pages/Register.jsx'
];

filesToProcess.forEach(file => {
    const filePath = path.join(__dirname, '../', file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');

    // Pattern 1: style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
    // We add glass-panel to className and remove the inline style or replace with empty
    
    // Replace theme button
    content = content.replace(
        /className="p-2\.5 rounded-xl transition-all active:scale-95 border"\n\s*style={{ backgroundColor: 'var\(--bg-card\)', borderColor: 'var\(--border-primary\)', color: 'var\(--text-secondary\)' }}/g,
        'className="p-2.5 rounded-xl active:scale-95 glass-panel"\n                        style={{ color: \'var(--text-secondary)\' }}'
    );
    
    // Replace menu dropdown
    content = content.replace(
        /className="absolute top-full mt-2 left-0 w-64 rounded-\[2rem\] shadow-2xl border p-2 z-\[100\] animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: 'var\(--bg-card\)', borderColor: 'var\(--border-primary\)' }}/g,
        'className="absolute top-full mt-2 left-0 w-64 rounded-[2rem] p-2 z-[100] animate-in slide-in-from-top-2 duration-200 glass-panel"'
    );
    
    // Replace big cards
    content = content.replace(
        /className="(.*?)shadow-(?:2xl|xl) border(.*?)".*?style={{ backgroundColor: 'var\(--bg-card\)', borderColor: 'var\(--border-primary\)' }}/g,
        'className="$1$2 glass-panel"'
    );
    
    // Replace modal cards
    content = content.replace(
        /className="w-full max-w-(?:sm|md|lg) rounded-\[2\.5rem\] shadow-2xl overflow-hidden(.*?)" style={{ backgroundColor: 'var\(--bg-card\)' }}/g,
        'className="w-full max-w-md rounded-[2.5rem] overflow-hidden$1 glass-panel"'
    );
    
    // Login / Register Theme button
    content = content.replace(
        /className="p-3 rounded-2xl transition-all active:scale-95 border shadow-sm"\n\s*style={{ backgroundColor: 'var\(--bg-card\)', borderColor: 'var\(--border-primary\)', color: 'var\(--text-secondary\)' }}/g,
        'className="p-3 rounded-2xl active:scale-95 glass-panel"\n                    style={{ color: \'var(--text-secondary)\' }}'
    );
    
    // Login / Register Main card
    content = content.replace(
        /className="w-full max-w-md rounded-\[2\.5rem\] overflow-hidden border transition-all duration-300 shadow-2xl" style={{ backgroundColor: 'var\(--bg-card\)', borderColor: 'var\(--border-primary\)' }}/g,
        'className="w-full max-w-md rounded-[2.5rem] overflow-hidden glass-panel"'
    );

    // Login Faculty/Student buttons
    content = content.replace(
        /className=\{`flex-1 flex items-center justify-center gap-2 py-2\.5 rounded-xl font-black text-\[10px\] transition-all \$\{([^}]+)\}`\}\n\s*style=\{\{ \n\s*backgroundColor: ([^?]+)\? 'var\(--bg-card\)' : 'transparent',\n\s*color: 'var\(--text-primary\)' \n\s*\}\}/g,
        'className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] ${$1} ${$2 ? \'glass-panel\' : \'\'}`}\n                            style={{ color: \'var(--text-primary)\' }}'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
