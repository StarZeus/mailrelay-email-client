import { NextRequest, NextResponse } from 'next/server';
import mjml2html from 'mjml';
import { webLogger } from '@/lib/logger';
import Handlebars from 'handlebars/dist/handlebars.min.js';
import { HandlebarsOptions } from '@/types/common';

interface HandlebarsOptions {
  fn: (context: any) => string;
  inverse: (context: any) => string;
  data: { path: string };
}

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

export async function POST(request: NextRequest) {
  try {
    const { template, templateType, data } = await request.json();

    if (!template) {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }

    if (!templateType || (templateType !== 'mjml' && templateType !== 'html')) {
      return NextResponse.json(
        { error: 'Valid template type (mjml or html) is required' },
        { status: 400 }
      );
    }

    // Ensure data is properly structured
    const templateData = data || {};
    
    // Log the data for debugging
    console.log('Template data:', JSON.stringify(templateData, null, 2));

    let html = '';

    try {
      // First apply Handlebars template with the data
      const compiledTemplate = Handlebars.compile(template, {
        strict: false,
        noEscape: true // Important for HTML content
      });
      const processedTemplate = compiledTemplate(templateData);

      // Then if it's MJML, convert to HTML
      if (templateType === 'mjml') {
        const mjmlResult = mjml2html(processedTemplate, {
          validationLevel: 'soft',
          minify: true
        });
        
        if (mjmlResult.errors && mjmlResult.errors.length > 0) {
          console.warn('MJML warnings:', mjmlResult.errors);
        }
        
        html = mjmlResult.html;
      } else {
        html = processedTemplate;
      }

      console.log('Successfully processed template');
      return NextResponse.json({ html });

    } catch (error: any) {
      console.error('Template processing error:', error);
      return NextResponse.json(
        { 
          error: 'Template processing error', 
          details: error.message,
          template: template.substring(0, 200) + '...' // First 200 chars for debugging
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 