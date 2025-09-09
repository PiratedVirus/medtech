const fs = require('fs');
const path = require('path');

// Files to process (excluding the script itself and node_modules)
const filesToProcess = [
  'app/api',
  'components',
  'app/admin',
  'prisma/seeds',
  'scripts'
];

// Patterns to replace
const replacements = [
  // Database field references in Prisma queries
  {
    pattern: /appointmentDate:\s*{([^}]+)}/g,
    replacement: 'doctorAvailability: { date: {$1} }'
  },
  {
    pattern: /appointmentDate:\s*([^,}\s]+)/g,
    replacement: 'doctorAvailability: { date: $1 }'
  },
  
  // Where clauses
  {
    pattern: /where:\s*{[^}]*appointmentDate:\s*{([^}]+)}[^}]*}/g,
    replacement: (match) => {
      return match.replace(/appointmentDate:\s*{([^}]+)}/, 'doctorAvailability: { date: {$1} }');
    }
  },
  
  // OrderBy clauses
  {
    pattern: /orderBy:\s*\[[^\]]*{\s*appointmentDate:\s*["']?(\w+)["']?[^}]*}[^\]]*\]/g,
    replacement: (match) => {
      return match.replace(/{\s*appointmentDate:\s*["']?(\w+)["']?[^}]*}/, '{ doctorAvailability: { date: "$1" } }');
    }
  },
  {
    pattern: /{\s*appointmentDate:\s*["']?(\w+)["']?\s*}/g,
    replacement: '{ doctorAvailability: { date: "$1" } }'
  },
  
  // Select clauses - remove appointmentDate from select
  {
    pattern: /select:\s*{[^}]*appointmentDate:\s*true[^}]*}/g,
    replacement: (match) => {
      return match.replace(/,\s*appointmentDate:\s*true/, '').replace(/appointmentDate:\s*true,\s*/, '');
    }
  },
  
  // Include clauses - remove appointmentDate from include
  {
    pattern: /include:\s*{[^}]*appointmentDate:\s*true[^}]*}/g,
    replacement: (match) => {
      return match.replace(/,\s*appointmentDate:\s*true/, '').replace(/appointmentDate:\s*true,\s*/, '');
    }
  },
  
  // Data creation/update - remove appointmentDate from data
  {
    pattern: /data:\s*{[^}]*appointmentDate:\s*[^,}]+[^}]*}/g,
    replacement: (match) => {
      return match.replace(/,\s*appointmentDate:\s*[^,}]+/, '').replace(/appointmentDate:\s*[^,}]+,\s*/, '');
    }
  },
  
  // TypeScript interfaces - remove appointmentDate field
  {
    pattern: /interface\s+\w+\s*{[^}]*appointmentDate:\s*[^;]+;[^}]*}/g,
    replacement: (match) => {
      return match.replace(/,\s*appointmentDate:\s*[^;]+;/, ';').replace(/appointmentDate:\s*[^;]+;\s*/, '');
    }
  },
  
  // Object property access - replace with doctorAvailability.date
  {
    pattern: /appointment\.appointmentDate/g,
    replacement: 'appointment.doctorAvailability.date'
  },
  {
    pattern: /apt\.appointmentDate/g,
    replacement: 'apt.doctorAvailability.date'
  },
  {
    pattern: /appt\.appointmentDate/g,
    replacement: 'appt.doctorAvailability.date'
  },
  
  // Variable assignments
  {
    pattern: /const\s+appointmentDate\s*=\s*new\s+Date\([^)]+\.appointmentDate\)/g,
    replacement: (match) => {
      return match.replace(/\.appointmentDate/, '.doctorAvailability.date');
    }
  },
  
  // Comments and documentation
  {
    pattern: /\/\/.*appointmentDate.*$/gm,
    replacement: '// Use doctorAvailability.date instead'
  },
  
  // String literals in code
  {
    pattern: /"appointmentDate"/g,
    replacement: '"doctorAvailability.date"'
  },
  {
    pattern: /'appointmentDate'/g,
    replacement: "'doctorAvailability.date'"
  }
];

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    // Apply all replacements
    replacements.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        if (typeof replacement === 'function') {
          newContent = newContent.replace(pattern, replacement);
        } else {
          newContent = newContent.replace(pattern, replacement);
        }
        changes += matches.length;
      }
    });
    
    // Additional specific replacements for common patterns
    const specificReplacements = [
      // Prisma where clauses
      {
        pattern: /where:\s*{\s*appointmentDate:\s*{([^}]+)}\s*}/g,
        replacement: 'where: { doctorAvailability: { date: {$1} } }'
      },
      
      // Prisma orderBy
      {
        pattern: /orderBy:\s*\[\s*{\s*appointmentDate:\s*["']?(\w+)["']?\s*}\s*\]/g,
        replacement: 'orderBy: [{ doctorAvailability: { date: "$1" } }]'
      },
      
      // Date filtering
      {
        pattern: /appointmentDate:\s*{\s*gte:\s*([^,}]+)\s*}/g,
        replacement: 'doctorAvailability: { date: { gte: $1 } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*lt:\s*([^,}]+)\s*}/g,
        replacement: 'doctorAvailability: { date: { lt: $1 } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*lte:\s*([^,}]+)\s*}/g,
        replacement: 'doctorAvailability: { date: { lte: $1 } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*gt:\s*([^,}]+)\s*}/g,
        replacement: 'doctorAvailability: { date: { gt: $1 } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*equals:\s*([^,}]+)\s*}/g,
        replacement: 'doctorAvailability: { date: { equals: $1 } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*not:\s*([^,}]+)\s*}/g,
        replacement: 'doctorAvailability: { date: { not: $1 } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*in:\s*\[([^\]]+)\]\s*}/g,
        replacement: 'doctorAvailability: { date: { in: [$1] } }'
      },
      {
        pattern: /appointmentDate:\s*{\s*notIn:\s*\[([^\]]+)\]\s*}/g,
        replacement: 'doctorAvailability: { date: { notIn: [$1] } }'
      }
    ];
    
    specificReplacements.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        changes += matches ? matches.length : 0;
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated ${filePath} (${changes} changes)`);
      return changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Function to recursively find files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          files.push(...findFiles(fullPath, extensions));
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Main execution
async function main() {
  console.log('🔧 Starting comprehensive appointmentDate removal...');
  console.log('📁 Processing directories:', filesToProcess);
  
  let totalChanges = 0;
  let processedFiles = 0;
  
  for (const dir of filesToProcess) {
    if (fs.existsSync(dir)) {
      console.log(`\n📂 Processing ${dir}...`);
      const files = findFiles(dir);
      
      for (const file of files) {
        // Skip this script itself
        if (file.includes('remove-all-appointment-date-references.js')) {
          continue;
        }
        
        const changes = processFile(file);
        if (changes > 0) {
          totalChanges += changes;
          processedFiles++;
        }
      }
    } else {
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
    }
  }
  
  console.log(`\n🎉 Cleanup completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Files processed: ${processedFiles}`);
  console.log(`   - Total changes: ${totalChanges}`);
  console.log(`\n✅ All appointmentDate references have been replaced with doctorAvailability.date`);
  console.log(`🔍 Please review the changes and test your application`);
}

main().catch(console.error);
