import Handlebars from 'handlebars';

export function compileTemplate(
  templateBody: string,
  data: Record<string, unknown>
): string {
  const template = Handlebars.compile(templateBody);
  return template(data);
}
