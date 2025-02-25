import Handlebars from 'handlebars/dist/handlebars.min.js';

// Register helpers for accessing nested properties
Handlebars.registerHelper('get', function(obj, prop) {
  if (!obj || !prop) return '';
  
  // Handle nested properties with dot notation
  if (prop.includes('.')) {
    const parts = prop.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) return '';
      current = current[part];
    }
    
    return current;
  }
  
  return obj[prop] || '';
});

// Helper for debugging
Handlebars.registerHelper('debug', function(value) {
  console.log('Debug value:', value);
  return JSON.stringify(value, null, 2);
});

// Helper for conditional statements
Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: { fn: (context: any) => string; inverse: (context: any) => string }) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

// Force Handlebars to not escape HTML in triple braces
Handlebars.registerHelper('raw', function(options) {
  return options.fn();
});

// Ensure Handlebars is properly configured
const originalCompile = Handlebars.compile;
Handlebars.compile = function(template: string, options?: any) {
  // Log the template for debugging
  console.log('Compiling template:', template.substring(0, 100) + '...');
  
  // Call the original compile function
  const compiled = originalCompile.call(this, template, options);
  
  // Return a wrapped function that logs the data and result
  return function(data: any) {
    console.log('Template data keys:', Object.keys(data));
    const result = compiled(data);
    console.log('Compiled result preview:', result.substring(0, 100) + '...');
    return result;
  };
};

// Register any custom helpers here if needed
// Handlebars.registerHelper('customHelper', function(value) {
//   return value.toUpperCase();
// });

export default Handlebars; 