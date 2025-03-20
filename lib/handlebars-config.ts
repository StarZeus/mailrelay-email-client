import Handlebars from 'handlebars/dist/handlebars.min.js';
import { HandlebarsOptions } from '@/types/common';


// Register Handlebars helpers for nested objects and arrays
Handlebars.registerHelper('json', function(context: any) {
  return JSON.stringify(context);
});

// Helper to get array element by index
Handlebars.registerHelper('arr', function(array: any[], index: number) {
  if (!Array.isArray(array)) return '';
  return array[index] || '';
});

// Helper to safely get nested array element
Handlebars.registerHelper('get_array_element', function(array: any[], index: number, path?: string) {
  if (!Array.isArray(array)) return '';
  const element = array[index];
  if (path && element) {
    return path.split('.').reduce((acc: any, part: string) => acc && acc[part], element);
  }
  return element || '';
});

Handlebars.registerHelper('get', function(obj: any, path: string) {
  return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
});

Handlebars.registerHelper('each_with_path', function(context: any, options: HandlebarsOptions) {
  let ret = "";
  if (Array.isArray(context)) {
    for (let i = 0; i < context.length; i++) {
      ret = ret + options.fn({
        ...context[i],
        "@index": i,
        "@path": `${options.data.path}.${i}`
      });
    }
  } else if (typeof context === 'object' && context !== null) {
    Object.entries(context).forEach(([key, value]) => {
      ret = ret + options.fn({
        key,
        value,
        "@path": `${options.data.path}.${key}`
      });
    });
  }
  return ret;
});

// Helper to safely access nested properties
Handlebars.registerHelper('lookup_nested', function(obj: any, path: string) {
  try {
    return path.split('.').reduce((acc: any, part: string) => {
      if (acc === undefined || acc === null) return '';
      return acc[part];
    }, obj);
  } catch (e) {
    return '';
  }
});

// Helper for conditional logic
Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: HandlebarsOptions) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// Helper for array operations
Handlebars.registerHelper('array_length', function(arr: any[]) {
  return Array.isArray(arr) ? arr.length : 0;
});

const compileHTML = (template: string, data: any) => {
  const compiledTemplate = Handlebars.compile(template, {
    strict: false,
    noEscape: true // Important for HTML content
  });
  const html = compiledTemplate(data);
  console.log('Compiled HTML:', html);
  return html;
};

export { Handlebars, compileHTML };

