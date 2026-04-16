// Función de carga (Server Load)
export const load = async ({ params }) => {
    return {
        templateId: params.templateId
    };
};
