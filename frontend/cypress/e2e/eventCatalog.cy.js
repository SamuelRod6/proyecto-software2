describe("Event Catalog Screen", () => {
	const eventsMock = [
		{
			id_evento: 1001,
			nombre: "Congreso de Biología",
			fecha_inicio: "01-06-2026",
			fecha_fin: "03-06-2026",
			fecha_cierre_inscripcion: "28-05-2026",
			inscripciones_abiertas: true,
			ubicacion: "Caracas, Venezuela",
			category: "Científico",
			current_enrolled: 10,
			max_enrolled: 30,
			is_enrolled: false,
		},
		{
			id_evento: 1002,
			nombre: "Simposio de Química",
			fecha_inicio: "10-07-2026",
			fecha_fin: "12-07-2026",
			fecha_cierre_inscripcion: "01-07-2026",
			inscripciones_abiertas: false,
			ubicacion: "Maracaibo, Venezuela",
			category: "Científico",
			current_enrolled: 30,
			max_enrolled: 30,
			is_enrolled: false,
		},
		{
			id_evento: 1003,
			nombre: "Evento Pasado",
			fecha_inicio: "01-01-2020",
			fecha_fin: "02-01-2020",
			fecha_cierre_inscripcion: "25-12-2019",
			inscripciones_abiertas: true,
			ubicacion: "Caracas, Venezuela",
			category: "Científico",
			current_enrolled: 2,
			max_enrolled: 20,
			is_enrolled: false,
		},
	];

	beforeEach(() => {
		cy.intercept("GET", "**/api/eventos", {
			statusCode: 200,
			body: eventsMock,
		}).as("getEvents");

		cy.visit("/event-catalog", {
			onBeforeLoad(win) {
				win.localStorage.setItem("auth-token", "fake-token");
			},
		});

		cy.wait("@getEvents");
	});

	it("muestra eventos vigentes/futuros y oculta los pasados", () => {
		cy.contains("Congreso de Biología").should("be.visible");
		cy.contains("Simposio de Química").should("be.visible");
		cy.contains("Evento Pasado").should("not.exist");
	});

	it("filtra por nombre desde el buscador", () => {
		cy.get('input[placeholder="Ej. Congreso de Biología"]').type("química");
		cy.contains("Simposio de Química").should("be.visible");
		cy.contains("Congreso de Biología").should("not.exist");
	});

	it("permite hacer clic en Inscribir cuando el evento está abierto", () => {
		cy.contains("Congreso de Biología")
			.parents('[class*="grid"]')
			.within(() => {
				cy.contains("button", "Inscribir").click();
			});

		cy.contains("Inscripción pendiente").should("be.visible");
	});
});
