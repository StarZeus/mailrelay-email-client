import { NextRequest, NextResponse } from 'next/server';
import mjml2html from 'mjml';
import Handlebars from '@/lib/handlebars-config';

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

    if (templateType === 'mjml') {
      try {
        // First convert MJML to HTML
        const mjmlResult = mjml2html(template);
        
        if (mjmlResult.errors && mjmlResult.errors.length > 0) {
          return NextResponse.json(
            { error: 'MJML parsing error', details: mjmlResult.errors },
            { status: 400 }
          );
        }
        
        // Then apply Handlebars template with the data
        try {
          const compiledTemplate = Handlebars.compile(mjmlResult.html);
          html = compiledTemplate(templateData);
          console.log('Successfully compiled MJML template with data');
        } catch (handlebarsError: any) {
          console.error('Handlebars compilation error:', handlebarsError);
          return NextResponse.json(
            { error: 'Handlebars compilation error', details: handlebarsError.message },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('MJML processing error:', error);
        return NextResponse.json(
          { error: 'MJML processing error', details: error.message },
          { status: 400 }
        );
      }
    } else {
      // HTML template
      try {
        try {
          const compiledTemplate = Handlebars.compile(template);
          html = compiledTemplate(templateData);
          console.log('Successfully compiled HTML template with data');
        } catch (handlebarsError: any) {
          console.error('Handlebars compilation error:', handlebarsError);
          return NextResponse.json(
            { error: 'Handlebars compilation error', details: handlebarsError.message },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('HTML template processing error:', error);
        return NextResponse.json(
          { error: 'HTML template processing error', details: error.message },
          { status: 400 }
        );
      }
    }

    // Log the final HTML output
    console.log('Final HTML output (first 200 chars):', html.substring(0, 200));

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error('Error rendering template:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 