package service

import (
	"context"
	"fmt"

	mensajesdto "project/backend/internal/mensajes/dto"
	"project/backend/internal/mensajes/repo"
	notifDto "project/backend/internal/notifications/dto"
	notifRepo "project/backend/internal/notifications/repo"
	notifService "project/backend/internal/notifications/service"
)

type MensajesService interface {
	CreateConversacion(ctx context.Context, req mensajesdto.CreateConversacionRequest) (*mensajesdto.ConversacionResponse, error)
	ListConversaciones(ctx context.Context, idUsuario int) ([]mensajesdto.ConversacionResponse, error)
	SendMensaje(ctx context.Context, req mensajesdto.SendMensajeRequest) (*mensajesdto.MensajeResponse, error)
	GetMensajes(ctx context.Context, idConversacion int) ([]mensajesdto.MensajeResponse, error)
	SearchUsuarios(ctx context.Context, q string) ([]mensajesdto.ParticipanteResponse, error)
	AddParticipante(ctx context.Context, idConversacion, idUsuario int) (*mensajesdto.ConversacionResponse, error)
	RemoveParticipante(ctx context.Context, idConversacion, idUsuario int) error
	GetParticipantes(ctx context.Context, idConversacion int) ([]mensajesdto.ParticipanteResponse, error)
}

type mensajesService struct {
	repo     repo.MensajesRepository
	notifSvc notifService.NotificationService
}

func New(r repo.MensajesRepository, notifR notifRepo.NotificationRepository) MensajesService {
	return &mensajesService{
		repo:     r,
		notifSvc: notifService.NewNotificationService(notifR),
	}
}

func (s *mensajesService) CreateConversacion(ctx context.Context, req mensajesdto.CreateConversacionRequest) (*mensajesdto.ConversacionResponse, error) {
	convID, err := s.repo.CreateConversacion(ctx, req.Asunto, req.ParticipanteIDs)
	if err != nil {
		return nil, err
	}
	participantes, _ := s.fetchParticipantes(ctx, convID)
	return &mensajesdto.ConversacionResponse{
		IDConversacion: convID,
		Asunto:         req.Asunto,
		Participantes:  participantes,
	}, nil
}

func (s *mensajesService) ListConversaciones(ctx context.Context, idUsuario int) ([]mensajesdto.ConversacionResponse, error) {
	convs, err := s.repo.ListConversacionesByUsuario(ctx, idUsuario)
	if err != nil {
		return nil, err
	}
	responses := make([]mensajesdto.ConversacionResponse, 0, len(convs))
	for _, conv := range convs {
		participantes, _ := s.fetchParticipantes(ctx, conv.IDConversacion)
		mensajes, _ := s.repo.ListMensajesByConversacion(ctx, conv.IDConversacion)

		resp := mensajesdto.ConversacionResponse{
			IDConversacion: conv.IDConversacion,
			Asunto:         conv.Asunto,
			Participantes:  participantes,
			UpdatedAt:      conv.UpdatedAt,
		}
		if len(mensajes) > 0 {
			last := mensajes[len(mensajes)-1]
			resp.UltimoMensaje = rowToMensajeResponse(&last)
		}
		responses = append(responses, resp)
	}
	return responses, nil
}

func (s *mensajesService) SendMensaje(ctx context.Context, req mensajesdto.SendMensajeRequest) (*mensajesdto.MensajeResponse, error) {
	msg, err := s.repo.CreateMensaje(ctx, req)
	if err != nil {
		return nil, err
	}

	// Notify participants (excluding sender)
	conv, _ := s.repo.FindConversacionByID(ctx, req.IDConversacion)
	asunto := ""
	if conv != nil {
		asunto = conv.Asunto
	}

	participantes, err := s.repo.FindParticipantesByConversacion(ctx, req.IDConversacion)
	if err == nil {
		for _, p := range participantes {
			if p.IDUsuario == req.IDRemitente {
				continue
			}
			mensaje := fmt.Sprintf(notifDto.MsgNuevoMensaje, msg.NombreRemitente, asunto)
			_, notifErr := s.notifSvc.CreateNotification(ctx, notifDto.CreateNotificationRequest{
				UserID:  p.IDUsuario,
				Type:    notifDto.NotificationTypeNuevoMensaje,
				Message: mensaje,
			})
			if notifErr != nil {
				fmt.Printf("[SendMensaje] Error notificando usuario %d: %v\n", p.IDUsuario, notifErr)
			}
		}
	}

	return rowToMensajeResponse(msg), nil
}

func (s *mensajesService) GetMensajes(ctx context.Context, idConversacion int) ([]mensajesdto.MensajeResponse, error) {
	mensajes, err := s.repo.ListMensajesByConversacion(ctx, idConversacion)
	if err != nil {
		return nil, err
	}
	responses := make([]mensajesdto.MensajeResponse, 0, len(mensajes))
	for _, m := range mensajes {
		m := m
		responses = append(responses, *rowToMensajeResponse(&m))
	}
	return responses, nil
}

func (s *mensajesService) SearchUsuarios(ctx context.Context, q string) ([]mensajesdto.ParticipanteResponse, error) {
	usuarios, err := s.repo.SearchUsuarios(ctx, q)
	if err != nil {
		return nil, err
	}
	result := make([]mensajesdto.ParticipanteResponse, 0, len(usuarios))
	for _, u := range usuarios {
		result = append(result, mensajesdto.ParticipanteResponse{
			IDUsuario: u.IDUsuario,
			Nombre:    u.Nombre,
			Email:     u.Email,
		})
	}
	return result, nil
}

func (s *mensajesService) AddParticipante(ctx context.Context, idConversacion, idUsuario int) (*mensajesdto.ConversacionResponse, error) {
	if err := s.repo.AddParticipante(ctx, idConversacion, idUsuario); err != nil {
		return nil, err
	}
	conv, err := s.repo.FindConversacionByID(ctx, idConversacion)
	if err != nil {
		return nil, err
	}
	participantes, _ := s.fetchParticipantes(ctx, idConversacion)
	return &mensajesdto.ConversacionResponse{
		IDConversacion: conv.IDConversacion,
		Asunto:         conv.Asunto,
		Participantes:  participantes,
		UpdatedAt:      conv.UpdatedAt,
	}, nil
}

func (s *mensajesService) RemoveParticipante(ctx context.Context, idConversacion, idUsuario int) error {
	return s.repo.RemoveParticipante(ctx, idConversacion, idUsuario)
}

func (s *mensajesService) GetParticipantes(ctx context.Context, idConversacion int) ([]mensajesdto.ParticipanteResponse, error) {
	return s.fetchParticipantes(ctx, idConversacion)
}

func (s *mensajesService) fetchParticipantes(ctx context.Context, convID int) ([]mensajesdto.ParticipanteResponse, error) {
	parts, err := s.repo.FindParticipantesByConversacion(ctx, convID)
	if err != nil {
		return nil, err
	}
	result := make([]mensajesdto.ParticipanteResponse, 0, len(parts))
	for _, p := range parts {
		u, err := s.repo.FindUsuarioByID(ctx, p.IDUsuario)
		if err != nil || u == nil {
			continue
		}
		result = append(result, mensajesdto.ParticipanteResponse{
			IDUsuario: u.IDUsuario,
			Nombre:    u.Nombre,
			Email:     u.Email,
		})
	}
	return result, nil
}

func rowToMensajeResponse(m *repo.MensajeRow) *mensajesdto.MensajeResponse {
	return &mensajesdto.MensajeResponse{
		IDMensaje:       m.IDMensaje,
		IDConversacion:  m.IDConversacion,
		IDRemitente:     m.IDRemitente,
		NombreRemitente: m.NombreRemitente,
		Cuerpo:          m.Cuerpo,
		AdjuntoURL:      m.AdjuntoURL,
		AdjuntoNombre:   m.AdjuntoNombre,
		CreatedAt:       m.CreatedAt,
	}
}

