// Función de carga (parametrización básica)
export const load = async ({ params }) => {
    return {
        templateId: params.templateId
    };
};
