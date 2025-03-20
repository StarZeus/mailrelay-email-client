import { NextRequest, NextResponse } from 'next/server';
import mjml2html from 'mjml';
import { compileHTML } from '@/lib/handlebars-config';

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
      const processedTemplate =  compileHTML(template, templateData);

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