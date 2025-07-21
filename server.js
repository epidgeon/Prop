// Import the packages we need
const express = require('express');
const cors = require('cors');

// Create our server
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware (these help our server understand different types of data)
app.use(cors()); // Allows our frontend to talk to our backend
app.use(express.json()); // Helps us read JSON data

// Smart text parsing functions (no AI needed!)
const parseNotesText = (text) => {
  const lowerText = text.toLowerCase();
  
  return {
    clientName: extractClientName(text),
    projectTitle: extractProjectTitle(text),
    clientSize: extractClientSize(text),
    industry: extractIndustry(text),
    timeline: extractTimeline(text),
    services: extractServices(text),
    clientBudget: extractBudget(text)
  };
};

// Function to find client name
const extractClientName = (text) => {
  // Look for patterns like "Client: Company Name" or "Company: Name"
  const patterns = [
    /(?:client|company|organization):\s*([^\n,]+)/i,
    /meeting with\s+([^\n,]+)/i,
    /([A-Z][a-z]+\s+(?:corp|corporation|inc|llc|ltd|company|foundation))/i
  ];
  
  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'Client Name Not Found';
};

// Function to guess project type
const extractProjectTitle = (text) => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('rebrand') || lowerText.includes('brand identity')) {
    return 'Brand Identity Redesign';
  }
  if (lowerText.includes('website') || lowerText.includes('web design')) {
    return 'Website Design Project';
  }
  if (lowerText.includes('logo')) {
    return 'Logo Design';
  }
  if (lowerText.includes('packaging')) {
    return 'Packaging Design';
  }
  if (lowerText.includes('marketing') || lowerText.includes('campaign')) {
    return 'Marketing Campaign Design';
  }
  
  return 'Design Project';
};

// Function to guess company size
const extractClientSize = (text) => {
  const lowerText = text.toLowerCase();
  
  // Look for employee numbers
  const employeeMatch = text.match(/(\d+)\s*employees?/i);
  if (employeeMatch) {
    const count = parseInt(employeeMatch[1]);
    if (count <= 10) return 'small';
    if (count <= 100) return 'medium';
    if (count <= 1000) return 'large';
    return 'enterprise';
  }
  
  // Look for size keywords
  if (lowerText.includes('startup') || lowerText.includes('small business')) return 'small';
  if (lowerText.includes('medium') || lowerText.includes('growing company')) return 'medium';
  if (lowerText.includes('large') || lowerText.includes('established')) return 'large';
  if (lowerText.includes('enterprise') || lowerText.includes('fortune')) return 'enterprise';
  
  return 'small'; // Default guess
};

// Function to detect industry
const extractIndustry = (text) => {
  const lowerText = text.toLowerCase();
  
  const industryKeywords = {
    technology: ['tech', 'software', 'app', 'saas', 'startup', 'digital'],
    finance: ['finance', 'bank', 'investment', 'financial', 'money'],
    healthcare: ['health', 'medical', 'hospital', 'clinic', 'healthcare'],
    retail: ['retail', 'store', 'shop', 'e-commerce', 'sales'],
    nonprofit: ['nonprofit', 'charity', 'foundation', 'ngo'],
    education: ['school', 'university', 'education', 'college', 'learning'],
    entertainment: ['entertainment', 'media', 'film', 'music', 'gaming']
  };
  
  for (let [industry, keywords] of Object.entries(industryKeywords)) {
    for (let keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return industry;
      }
    }
  }
  
  return 'technology'; // Default guess
};

// Function to find timeline
const extractTimeline = (text) => {
  // Look for specific week mentions
  const weekMatch = text.match(/(\d+)\s*weeks?/i);
  if (weekMatch) return weekMatch[1];
  
  // Look for month mentions and convert to weeks
  const monthMatch = text.match(/(\d+)\s*months?/i);
  if (monthMatch) return (parseInt(monthMatch[1]) * 4).toString();
  
  // Look for urgency words
  const lowerText = text.toLowerCase();
  if (lowerText.includes('asap') || lowerText.includes('urgent') || lowerText.includes('rush')) return '2';
  if (lowerText.includes('soon') || lowerText.includes('quickly')) return '3';
  if (lowerText.includes('flexible') || lowerText.includes('no rush')) return '8';
  
  return '4'; // Default 4 weeks
};

// Function to detect needed services
const extractServices = (text) => {
  const lowerText = text.toLowerCase();
  const services = [];
  
  if (lowerText.includes('logo')) services.push('logo');
  if (lowerText.includes('brand') || lowerText.includes('identity')) services.push('branding');
  if (lowerText.includes('website') || lowerText.includes('web')) services.push('website');
  if (lowerText.includes('print') || lowerText.includes('brochure') || lowerText.includes('flyer')) services.push('print');
  if (lowerText.includes('packaging') || lowerText.includes('product design')) services.push('packaging');
  if (lowerText.includes('marketing') || lowerText.includes('campaign') || lowerText.includes('social')) services.push('marketing');
  
  return services.length > 0 ? services : ['branding']; // Default to branding if nothing found
};

// Function to find budget
const extractBudget = (text) => {
  // Look for dollar amounts
  const budgetMatch = text.match(/\$(\d{1,3}(?:,\d{3})*|\d+)/);
  if (budgetMatch) {
    return budgetMatch[1].replace(',', '');
  }
  
  // Look for "budget" keyword with numbers
  const budgetWordMatch = text.match(/budget.*?(\d+,?\d*)/i);
  if (budgetWordMatch) {
    return budgetWordMatch[1].replace(',', '');
  }
  
  return ''; // No budget found
};

// API endpoint to parse notes
app.post('/api/parse-notes', (req, res) => {
  try {
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ error: 'No notes provided' });
    }
    
    const parsedData = parseNotesText(notes);
    
    res.json({
      success: true,
      data: parsedData,
      originalNotes: notes
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to parse notes' 
    });
  }
});

// Test endpoint to make sure server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ Ready to parse meeting notes!');
});