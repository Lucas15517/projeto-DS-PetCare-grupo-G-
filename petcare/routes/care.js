'use strict';

function buildAdvice(pet) {
  const recommendations = [];

  if (pet.age <= 1) {
    recommendations.push('Como é jovem, mantenha o acompanhamento de crescimento e converse com um veterinário sobre vacinação e prevenção adequadas à espécie.');
  } else if ((pet.species === 'Cachorro' && pet.age >= 8) ||
             (pet.species === 'Gato' && pet.age >= 10)) {
    recommendations.push('Pela faixa etária informada, vale conversar com o veterinário sobre avaliações preventivas e mudanças de rotina.');
  } else {
    recommendations.push('Mantenha consultas preventivas e observe mudanças de comportamento, apetite e disposição.');
  }

  if (pet.species === 'Cachorro') {
    recommendations.push('Inclua passeios e atividades adequados à idade e à condição do animal; mantenha água fresca disponível.');
    recommendations.push('A frequência de banho e escovação depende da pelagem e da rotina. Evite excessos e siga a orientação profissional.');
  } else if (pet.species === 'Gato') {
    recommendations.push('Mantenha a caixa de areia limpa, água fresca e locais tranquilos para descanso.');
    recommendations.push('Observe a pelagem e faça escovação conforme a necessidade do animal.');
  } else {
    recommendations.push('Como a espécie está cadastrada como “Outro”, procure orientação específica para as necessidades desse animal.');
  }

  return {
    pet_name: pet.name,
    method: 'Sistema de regras explicável',
    recommendations,
    notice: 'Orientações educativas gerais; não substituem avaliação de um médico-veterinário.'
  };
}

module.exports = async function careRoutes(context) {
  const { route, method, url, send, store, user } = context;
  if (route !== '/api/care-advice' || method !== 'GET') return false;

  const petId = Number(url.searchParams.get('pet_id'));
  const pet = store.getPet(user.id, petId);
  if (!pet) {
    send(context.res, 404, { error: 'Pet não encontrado.' });
    return true;
  }

  send(context.res, 200, buildAdvice(pet));
  return true;
};
