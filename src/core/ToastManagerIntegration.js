/**
 * Integration layer - adds TemplateManager methods to ToastManager
 * This allows ToastManager to access template functionality
 */

// Add TemplateManager methods to ToastManager
ToastManager.templates = TemplateManager.templates;
ToastManager.registerTemplate = TemplateManager.registerTemplate.bind(TemplateManager);
ToastManager.extractTokens = TemplateManager.extractTokens.bind(TemplateManager);
ToastManager.renderTemplate = TemplateManager.renderTemplate.bind(TemplateManager);
ToastManager.getTemplate = TemplateManager.getTemplate.bind(TemplateManager);
ToastManager.listTemplates = TemplateManager.listTemplates.bind(TemplateManager);
ToastManager.deleteTemplate = TemplateManager.deleteTemplate.bind(TemplateManager);
ToastManager.initializeBuiltInTemplates = TemplateManager.initializeBuiltInTemplates.bind(TemplateManager);
